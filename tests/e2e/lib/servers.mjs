import { spawn, spawnSync } from 'node:child_process';
import { createConnection, createServer } from 'node:net';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './registries.mjs';

const stripSlash = u => String(u || '').replace(/\/+$/, '');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function isPortFree(port) {
  return new Promise(resolve => {
    const probe = createConnection({ port, host: '127.0.0.1' });
    probe.once('connect', () => {
      probe.destroy();
      resolve(false);
    });
    probe.once('error', () => {
      const srv = createServer();
      srv.unref();
      srv.on('error', () => resolve(false));
      srv.listen(port, '127.0.0.1', () => srv.close(() => resolve(true)));
    });
  });
}

async function httpOk(url, timeoutMs = 2000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'manual' });
    return r.status === 200;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function waitForHttp200(url, { timeoutMs = 60000, label = url, getExitError } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (getExitError) {
      const err = getExitError();
      if (err) throw new Error(`${label} exited early: ${err}`);
    }
    if (await httpOk(url, 2500)) return;
    await new Promise(r => setTimeout(r, 350));
  }
  throw new Error(`Timed out waiting for HTTP 200 at ${label} (${timeoutMs}ms)`);
}

function newestMtime(dir) {
  let max = 0;
  if (!existsSync(dir)) return 0;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === 'public') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) max = Math.max(max, newestMtime(full));
    else max = Math.max(max, st.mtimeMs);
  }
  return max;
}

function readBakedLegacyOrigin() {
  const manifestPath = join(ROOT, 'apps', 'web', '.next', 'routes-manifest.json');
  if (!existsSync(manifestPath)) return null;
  try {
    const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const fb = m.rewrites?.fallback?.[0]?.destination;
    if (!fb) return null;
    return new URL(fb).origin;
  } catch {
    return null;
  }
}

function killTree(child) {
  if (!child || child.exitCode !== null || child.killed) return;
  try {
    child.kill('SIGTERM');
  } catch {}
  if (process.platform === 'win32' && child.pid) {
    try {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {}
  }
}

function runSyncEngine() {
  const script = join(ROOT, 'apps', 'web', 'scripts', 'sync-engine.mjs');
  const res = spawnSync(process.execPath, [script], { cwd: ROOT, encoding: 'utf8' });
  if (res.status !== 0) {
    const out = `${res.stderr || ''}\n${res.stdout || ''}`;
    const alreadySynced = existsSync(join(ROOT, 'apps', 'web', 'public', '_e', 'engine', 'index.js'));
    if (alreadySynced && /EPERM|EBUSY|EACCES/i.test(out)) {
      console.warn('Warning: sync-engine.mjs hit EPERM/EBUSY on public/_e; reusing existing synced assets.');
      return;
    }
    throw new Error(`sync-engine.mjs failed (${res.status}): ${out}`);
  }
}

export async function resolveOrStartServers({ mode = 'auto', legacyUrl, webUrl } = {}) {
  if (!['auto', 'dev', 'start'].includes(mode)) {
    throw new Error(`Invalid mode "${mode}". Expected one of: auto, dev, start.`);
  }
  const extLegacy = stripSlash(legacyUrl || process.env.LEGACY_URL);
  const extWeb = stripSlash(webUrl || process.env.WEB_URL);
  if (Boolean(extLegacy) !== Boolean(extWeb)) {
    throw new Error('Both --legacy-url (LEGACY_URL) and --web-url (WEB_URL) must be provided together.');
  }
  if (extLegacy && extWeb) {
    await waitForHttp200(`${extLegacy}/themes/index.json`, { timeoutMs: 10000, label: 'external legacy' });
    await waitForHttp200(`${extWeb}/v2/`, { timeoutMs: 10000, label: 'external web' });
    return {
      legacyUrl: extLegacy,
      webUrl: extWeb,
      mode: 'external',
      external: true,
      onBeforeStop: () => {},
      stop: async () => {},
    };
  }

  // If an existing Next.js dev server holds .next/dev/lock, wait briefly in case a concurrent run is finishing;
  // if :3000 & :3001 are both serving 200, attach to them instead of colliding on .next/dev/lock.
  const devLock = join(ROOT, 'apps', 'web', '.next', 'dev', 'lock');
  if (existsSync(devLock)) {
    const deadline = Date.now() + 20000;
    while (existsSync(devLock) && Date.now() < deadline) {
      const okWeb = await httpOk('http://127.0.0.1:3000/v2/');
      const okLeg = await httpOk('http://127.0.0.1:3001/themes/index.json');
      if (okWeb && okLeg) {
        return {
          legacyUrl: 'http://127.0.0.1:3001',
          webUrl: 'http://127.0.0.1:3000',
          mode: 'attached',
          external: true,
          onBeforeStop: () => {},
          stop: async () => {},
        };
      }
      await new Promise(r => setTimeout(r, 500));
    }
    if (existsSync(devLock)) {
      throw new Error(
        'Another next dev instance holds apps/web/.next/dev/lock (and :3000/:3001 are not both serving 200); pass --legacy-url and --web-url or stop it.'
      );
    }
  }

  // Decide dev vs start for auto mode
  let resolvedMode = mode;
  if (resolvedMode === 'auto') {
    const buildIdPath = join(ROOT, 'apps', 'web', '.next', 'BUILD_ID');
    const configMtime = ['next.config.ts', 'package.json']
      .map(f => join(ROOT, 'apps', 'web', f))
      .filter(existsSync)
      .reduce((mx, f) => Math.max(mx, statSync(f).mtimeMs), 0);
    const buildFresh = existsSync(buildIdPath) &&
      statSync(buildIdPath).mtimeMs >= Math.max(
        newestMtime(join(ROOT, 'apps', 'web', 'src')),
        newestMtime(join(ROOT, 'packages')),
        configMtime
      );
    const baked = readBakedLegacyOrigin();
    const bakedHostOk = !baked || ['localhost', '127.0.0.1'].includes(new URL(baked).hostname);
    const bakedPort = baked ? Number(new URL(baked).port || 3001) : 3001;
    if (buildFresh && bakedHostOk && !existsSync(devLock) && await isPortFree(3000) && await isPortFree(bakedPort)) {
      resolvedMode = 'start';
    } else {
      resolvedMode = 'dev';
    }
  }

  let startLegacyPort = 3001;
  if (resolvedMode === 'start') {
    const buildIdPath = join(ROOT, 'apps', 'web', '.next', 'BUILD_ID');
    if (!existsSync(buildIdPath)) {
      throw new Error('apps/web/.next/BUILD_ID not found; run `npm run build -w @sayhello/web` or use --mode=dev');
    }
    const baked = readBakedLegacyOrigin();
    if (baked) {
      const bakedHost = new URL(baked).hostname;
      if (bakedHost !== 'localhost' && bakedHost !== '127.0.0.1') {
        throw new Error(`Baked LEGACY_ORIGIN (${baked}) is not local; pass --legacy-url and --web-url or use --mode=dev`);
      }
      startLegacyPort = Number(new URL(baked).port || 3001);
    }
    if (!(await isPortFree(3000))) {
      throw new Error('Port 3000 is already in use; cannot start Next.js in --mode=start');
    }
    if (!(await isPortFree(startLegacyPort))) {
      throw new Error(`Port ${startLegacyPort} is already in use; cannot start legacy server in --mode=start`);
    }
  }

  runSyncEngine();

  const children = [];
  const logs = [];
  const beforeStopHooks = [];
  let stopped = false;

  const stop = async () => {
    if (stopped) return;
    stopped = true;
    process.off('SIGINT', onSigInt);
    process.off('SIGTERM', onSigTerm);
    for (const c of [...children].reverse()) killTree(c);
  };
  const handleSignal = async code => {
    for (const fn of [...beforeStopHooks].reverse()) {
      try { await fn(); } catch {}
    }
    await stop();
    process.exit(code);
  };
  const onSigInt = () => { void handleSignal(130); };
  const onSigTerm = () => { void handleSignal(143); };
  process.on('SIGINT', onSigInt);
  process.on('SIGTERM', onSigTerm);

  try {
    let legacyPort;
    let webPort;
    let nextArgs;

    if (resolvedMode === 'start') {
      legacyPort = startLegacyPort;
      webPort = 3000;
      nextArgs = ['start', '-p', String(webPort)];
    } else {
      legacyPort = await getFreePort();
      webPort = await getFreePort();
      while (webPort === legacyPort) webPort = await getFreePort();
      nextArgs = ['dev', '-p', String(webPort)];
    }

    const legacyServe = join(ROOT, 'legacy', 'scripts', 'serve.mjs');
    const legacyProc = spawn(process.execPath, [legacyServe, String(legacyPort)], {
      cwd: join(ROOT, 'legacy'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(legacyProc);
    let legacyErr = '';
    legacyProc.stderr.on('data', d => { legacyErr += d.toString(); });
    legacyProc.on('exit', code => {
      if (!stopped && code !== 0) legacyErr ||= `code ${code}`;
    });

    const targetLegacyUrl = `http://127.0.0.1:${legacyPort}`;
    await waitForHttp200(`${targetLegacyUrl}/themes/index.json`, {
      timeoutMs: 15000,
      label: 'legacy serve.mjs',
      getExitError: () => (legacyProc.exitCode !== null ? legacyErr || `code ${legacyProc.exitCode}` : null),
    });

    const nextBin = join(ROOT, 'apps', 'web', 'node_modules', 'next', 'dist', 'bin', 'next');
    const webProc = spawn(process.execPath, [nextBin, ...nextArgs], {
      cwd: join(ROOT, 'apps', 'web'),
      env: { ...process.env, LEGACY_ORIGIN: targetLegacyUrl, PORT: String(webPort) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(webProc);
    let webErr = '';
    webProc.stdout.on('data', d => { logs.push(d.toString()); });
    webProc.stderr.on('data', d => { webErr += d.toString(); logs.push(d.toString()); });
    webProc.on('exit', code => {
      if (!stopped && code !== 0) webErr ||= `code ${code}`;
    });

    const targetWebUrl = `http://127.0.0.1:${webPort}`;
    await waitForHttp200(`${targetWebUrl}/v2/`, {
      timeoutMs: 60000,
      label: `next ${nextArgs[0]}`,
      getExitError: () => (webProc.exitCode !== null ? `${webErr || `code ${webProc.exitCode}`}\n${logs.slice(-10).join('')}` : null),
    }).catch(e => {
      throw new Error(`${e.message}\nNext logs:\n${logs.slice(-15).join('')}`);
    });
    await waitForHttp200(`${targetWebUrl}/themes/index.json`, {
      timeoutMs: 20000,
      label: 'next fallback proxy -> legacy',
    });

    return {
      legacyUrl: targetLegacyUrl,
      webUrl: targetWebUrl,
      mode: resolvedMode,
      external: false,
      onBeforeStop: fn => { if (typeof fn === 'function') beforeStopHooks.push(fn); },
      stop,
    };
  } catch (err) {
    await stop();
    throw err;
  }
}

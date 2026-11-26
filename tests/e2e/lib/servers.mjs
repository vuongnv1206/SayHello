import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, readdirSync, statSync } from 'node:fs';
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

/** Dùng server đang chạy nếu có (--web-url hoặc `npm run dev` ở :3000), không thì tự khởi chạy Next.js. */
export async function resolveOrStartServers({ mode = 'auto', webUrl } = {}) {
  if (!['auto', 'dev', 'start'].includes(mode)) {
    throw new Error(`Invalid mode "${mode}". Expected one of: auto, dev, start.`);
  }
  const attach = (url, how) => ({ webUrl: url, mode: how, onBeforeStop: () => {}, stop: async () => {} });

  const extWeb = stripSlash(webUrl || process.env.WEB_URL);
  if (extWeb) {
    await waitForHttp200(`${extWeb}/`, { timeoutMs: 10000, label: 'external web' });
    return attach(extWeb, 'external');
  }

  // Mỗi thư mục chỉ chạy được một `next dev`: nếu đã có server đang giữ khoá thì dùng luôn nó.
  const devLock = join(ROOT, 'apps', 'web', '.next', 'dev', 'lock');
  if (mode !== 'start' && existsSync(devLock) && await httpOk('http://127.0.0.1:3000/', 20000)) {
    return attach('http://127.0.0.1:3000', 'attached');
  }

  let resolvedMode = mode;
  const buildIdPath = join(ROOT, 'apps', 'web', '.next', 'BUILD_ID');
  if (resolvedMode === 'auto') {
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
    resolvedMode = buildFresh ? 'start' : 'dev';
  }
  if (resolvedMode === 'start' && !existsSync(buildIdPath)) {
    throw new Error('apps/web/.next/BUILD_ID not found; run `npm run build` or use --mode=dev');
  }

  runSyncEngine();

  const logs = [];
  const beforeStopHooks = [];
  let child = null;
  let stopped = false;

  const stop = async () => {
    if (stopped) return;
    stopped = true;
    process.off('SIGINT', onSigInt);
    process.off('SIGTERM', onSigTerm);
    killTree(child);
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
    const webPort = await getFreePort();
    const nextBin = [join(ROOT, 'node_modules'), join(ROOT, 'apps', 'web', 'node_modules')]
      .map(dir => join(dir, 'next', 'dist', 'bin', 'next'))
      .find(existsSync);
    if (!nextBin) throw new Error('Cannot find the next package; run `npm install`');

    child = spawn(process.execPath, [nextBin, resolvedMode, '-p', String(webPort)], {
      cwd: join(ROOT, 'apps', 'web'),
      env: { ...process.env, PORT: String(webPort) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', d => { logs.push(d.toString()); });
    child.stderr.on('data', d => { logs.push(d.toString()); });

    const targetWebUrl = `http://127.0.0.1:${webPort}`;
    await waitForHttp200(`${targetWebUrl}/`, {
      timeoutMs: 60000,
      label: `next ${resolvedMode}`,
      getExitError: () => (child.exitCode !== null ? `code ${child.exitCode}` : null),
    }).catch(e => {
      throw new Error(`${e.message}\nNext logs:\n${logs.slice(-15).join('')}`);
    });

    return {
      webUrl: targetWebUrl,
      mode: resolvedMode,
      onBeforeStop: fn => { if (typeof fn === 'function') beforeStopHooks.push(fn); },
      stop,
    };
  } catch (err) {
    await stop();
    throw err;
  }
}

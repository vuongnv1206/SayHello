// Mẫu "Album Nhạc": thiệp là một đĩa than bìa gập. Lời mời in cố định ở bìa trong, danh sách bài là chương trình cưới.
//   Bìa: vỏ đĩa dán tem tên khách, mép đĩa ló bên phải. Kéo đĩa hoặc bấm nút để rút bìa ra.
//   Mặt A: lời mời, ngày dương và âm lịch, địa điểm; mỗi buổi lễ là một bài.
//   Bìa sau: ảnh và phần ghi danh hai gia đình. Mặt B: hồi âm kèm một bài muốn nghe ở tiệc. Mừng cưới, Lời chúc, Lời hẹn.
// Mức chuyển động: chỉ CSS, đĩa không quay vòng. lite: bìa mở sẵn hai mặt, không kéo đĩa.
// Ảnh dùng: images.hero (bìa đĩa), album[], images.thanks (ảnh cuối).
import { defineTheme, html, br, plain, qrUrl, rsvpForm, wishForm, wishList, countdown, fmt } from '@sayhello/engine';

const initial = s => (s || '').trim().charAt(0).toUpperCase();
const two = n => String(n).padStart(2, '0');

// Đĩa than: rãnh bằng CSS, nhãn giữa ghi chữ cái đầu hai người
const disc = n => html`<i class="dia" aria-hidden="true"><b>${initial(n.first)}<small>và</small>${initial(n.second)}</b></i>`;

export default defineTheme({
  id: 'album-nhac',
  name: 'Album Nhạc',
  version: '1.0.0',
  tier: 'premium',
  layout: 'folio',
  voice: 'than-mat',
  themeColor: '#2B0F1A',
  tagline: 'Đĩa than bìa gập: lời mời ở bìa trong, chương trình cưới là danh sách bài.',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Hanken+Grotesk:wght@400;500;600&display=swap',
  gateMs: 600,
  moment: {
    id: 'sleeve-unsheathe',
    verb: 'slide',
    verbLabel: 'Rút đĩa khỏi bìa',
    trigger: 'click-or-drag',
    durationMs: 340,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    reducedFallback: 'instant-swap',
  },
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional', countdown: 'optional', story: 'off' },
  slots: {
    images: { hero: { required: true, aspect: '1:1', label: 'Ảnh bìa đĩa' }, album: { min: 2, ideal: 5, max: 16 }, thanks: { aspect: '3:4', label: 'Ảnh lời hẹn cuối thiệp' } },
  },
  topics: [
    {
      id: 'ruou-vang', name: 'Rượu vang', desc: 'Phòng nghe nhạc màu rượu vang, nhãn đĩa hồng phấn.',
      swatch: ['#2B0F1A', '#EBC6C3'], themeColor: '#2B0F1A',
      vars: { '--sh-bg': '#2B0F1A', '--sh-ink': '#F6ECE9', '--sh-accent': '#EBC6C3', '--sh-accent-ink': '#2B0F1A', '--sh-panel': '#3D1626', '--sh-soft': 'rgba(246,236,233,0.22)', '--al-nen-2': '#3D1626', '--al-mo': '#D3B6BC', '--al-the': '#3A1524' },
    },
    {
      id: 'dia-sai-gon', name: 'Đĩa Sài Gòn xưa', desc: 'Bìa bồi ngà, mực nâu gỉ sắt, tem vuông tiệm băng đĩa, danh mục hai cột.',
      swatch: ['#F2ECE0', '#7C3626'], themeColor: '#F2ECE0',
      vars: { '--sh-bg': '#F2ECE0', '--sh-ink': '#1E1B18', '--sh-accent': '#7C3626', '--sh-accent-ink': '#F8F3EA', '--sh-panel': '#E8E0CF', '--sh-soft': 'rgba(30,27,24,0.22)', '--al-nen-2': '#F7F2E8', '--al-mo': '#55483C', '--al-the': '#E9E1D0' },
    },
    {
      id: 'vai-bo', name: 'Vải bố acoustic', desc: 'Vải bố yến mạch, xanh rêu, dây buộc giấy và ảnh bo tròn.',
      swatch: ['#F4F0E8', '#2A4032'], themeColor: '#F4F0E8',
      vars: { '--sh-bg': '#EDE7DB', '--sh-ink': '#22332A', '--sh-accent': '#2A4032', '--sh-accent-ink': '#F4F0E8', '--sh-panel': '#F4F0E8', '--sh-soft': 'rgba(34,51,42,0.22)', '--al-nen-2': '#F4F0E8', '--al-mo': '#4C5B51', '--al-the': '#F7F4ED' },
    },
    {
      id: 'bang-cassette', name: 'Băng cassette', desc: 'Tờ gấp bìa băng có gáy in tên, mực chàm, nhấn son, ảnh khổ ngang.',
      swatch: ['#EFECE4', '#B63B2E'], themeColor: '#1E2E4A',
      vars: { '--sh-bg': '#1E2E4A', '--sh-ink': '#F1EEE6', '--sh-accent': '#B63B2E', '--sh-accent-ink': '#FFF8F2', '--sh-panel': '#28395A', '--sh-soft': 'rgba(241,238,230,0.24)', '--al-nen-2': '#28395A', '--al-mo': '#C9CEDB', '--al-the': '#27375A' },
    },
  ],
  defaults: {
    texts: {
      coverNote: 'Album cưới',
      sticker: 'Dành tặng',
      coverOpen: 'Mở bìa đĩa',
      coverHint: 'Kéo đĩa sang phải, hoặc bấm nút',
      sideA: 'Mặt A · Lời mời',
      inviteKicker: 'Trân trọng kính mời',
      inviteLine: 'đến dự lễ thành hôn của chúng mình',
      tracksTitle: 'Danh sách bài',
      rsvpTrack: 'Hồi âm và xin một bài',
      sleeveTitle: 'Bìa sau',
      madeIn: 'Thực hiện tại',
      sideB: 'Mặt B · Hồi âm',
      rsvpLead: 'Báo chúng mình bạn có đến không, và xin một bài bạn muốn nghe ở tiệc cưới.',
      songLabel: 'Bài bạn muốn nghe ở tiệc (không bắt buộc)',
      songPlaceholder: 'Tên bài hát, ca sĩ',
      songAdded: 'đã vào danh sách phát của tiệc cưới.',
      giftTitle: 'Mừng cưới',
      wishTitle: 'Lời đề tặng',
      goodbye: 'Hẹn gặp {k} ở {c}',
    },
  },

  scenes: [
    /* ===== 1. Vỏ đĩa (bìa) ===== */
    {
      id: 'vo-dia', kind: 'gate',
      render: ({ names: n, texts: t, date, img, guest }) => html`
        <div class="cong">
          <div class="bo-dia">
            ${disc(n)}
            <div class="bia">
              <img src="${img('hero', 0)}" alt="Ảnh cưới ${n.first} và ${n.second}" fetchpriority="high">
              <div class="bia-chu">
                <h1><span>${n.first}</span> <span>và ${n.second}</span></h1>
                <p>${t.coverNote}, phát hành ${fmt.short(date)}</p>
              </div>
              <p class="tem">${t.sticker} <b>${guest()}</b></p>
            </div>
          </div>
          <button type="button" class="nut-mo" data-open>${t.coverOpen}</button>
          <p class="goi-y">${t.coverHint}</p>
        </div>`,
      mount(el, ctx) {
        const wrap = el.querySelector('.bo-dia'), record = wrap.querySelector('.dia');
        const open = () => { if (!ctx.opened) ctx.open(); };
        el.querySelector('[data-open]').addEventListener('click', open);
        if (ctx.reduced) return;
        let startX = null;
        record.addEventListener('pointerdown', e => { startX = e.clientX; record.setPointerCapture?.(e.pointerId); record.classList.add('dang-keo'); });
        record.addEventListener('pointermove', e => {
          if (startX == null) return;
          const pull = Math.max(0, Math.min(1, (e.clientX - startX) / (wrap.offsetWidth * .5)));
          record.style.setProperty('--keo', pull.toFixed(3));
          if (pull > .45) { startX = null; open(); }
        });
        const release = () => { startX = null; record.classList.remove('dang-keo'); if (!ctx.opened) record.style.removeProperty('--keo'); };
        record.addEventListener('pointerup', release);
        record.addEventListener('pointercancel', release);
        record.addEventListener('click', open);
      },
    },

    /* ===== 2. Mặt A: lời mời và danh sách bài ===== */
    {
      id: 'mat-a', label: 'Lời mời và chương trình', provides: ['when', 'where', 'map', 'countdown'],
      render: ctx => {
        const { names: n, texts: t, date, city, main, events, places, img, guest } = ctx;
        const place = e => places.find(p => p.address && e.address && p.address === e.address) || null;
        return html`
        <div class="gap">
          <div class="gap-trai">
            <div class="may-hat">
              ${disc(n)}
              <img class="anh-bia" src="${img('hero', 0)}" alt="${n.first} và ${n.second}">
              <svg class="can-kim" viewBox="0 0 60 140" aria-hidden="true"><circle cx="46" cy="14" r="10"/><path d="M46 14 L44 82 L22 126" fill="none" stroke-width="5"/><rect x="12" y="120" width="18" height="16" rx="2"/></svg>
            </div>
          </div>
          <div class="gap-phai">
            <p class="mat">${t.sideA}</p>
            <p class="kinh-moi">${t.inviteKicker} <b>${guest('Quý khách')}</b></p>
            <p class="le">${t.inviteLine}</p>
            <h2 class="ten-doi"><span>${n.first}</span> <i>và</i> <span>${n.second}</span></h2>
            <p class="ngay">${fmt.long(date)}, ${fmt.time(date)}</p>
            ${main?.lunar ? html`<p class="am">${main.lunar}</p>` : ''}
            ${main?.venue ? html`<p class="noi"><b>${main.venue}</b></p>` : city ? html`<p class="noi">${city}</p>` : ''}
            ${main?.address ? html`<p class="am">${br(main.address)}</p>` : ''}
            <div class="con-lai">${countdown(ctx, { done: 'Bài hát đã bắt đầu' })}</div>

            <h3 class="ds-dau">${t.tracksTitle}</h3>
            <ol class="bai">
              ${events.map((e, i) => html`
                <li data-ev="${i}">
                  <span class="so">${two(i + 1)}</span>
                  <div>
                    <p class="ten-bai"><span>${e.title}</span><span class="thoi">${fmt.time(e.date)}</span></p>
                    <p class="am">${fmt.long(e.date)}</p>
                    ${e.lunar ? html`<p class="am">${e.lunar}</p>` : ''}
                    ${e.venue ? html`<p>${e.venue}</p>` : ''}
                    ${e.address ? html`<p class="am">${br(e.address)}</p>` : ''}
                    <p class="lien-ket">
                      ${place(e) ? html`<a href="${place(e).url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                      ${e.gcal ? html`<a href="${e.gcal}" target="_blank" rel="noopener">Lưu vào lịch</a>` : ''}
                    </p>
                  </div>
                </li>`)}
            </ol>
            <a class="bai-hoi-am" href="#hoi-am"><span class="so">${two(events.length + 1)}</span><span>${t.rsvpTrack}</span></a>
          </div>
        </div>`;
      },
      mount(el, ctx) {
        const deck = el.querySelector('.may-hat');
        ctx.on('open', () => requestAnimationFrame(() => deck.classList.add('ha-kim')));
      },
    },

    /* ===== 3. Bìa sau: ảnh và ghi danh ===== */
    {
      id: 'bia-sau', label: 'Ảnh và ghi danh', provides: ['album'],
      render: ({ album, captions, families, texts: t, city, date }) => html`
        <h2>${t.sleeveTitle}</h2>
        ${album.length ? html`
          <div class="luoi-anh">
            ${album.slice(0, 8).map((src, i) => html`<figure><img src="${src}" alt="${captions[i] || `Ảnh cưới ${i + 1}`}" loading="lazy" decoding="async">${captions[i] ? html`<figcaption>${captions[i]}</figcaption>` : ''}</figure>`)}
          </div>` : ''}
        <dl class="ghi-danh">
          ${families.map(f => html`<div><dt>${f.side}</dt><dd>${[f.father && `Ông ${f.father}`, f.mother && `Bà ${f.mother}`].filter(Boolean).join(', ')}</dd>${f.address ? html`<dd class="am">${br(f.address)}</dd>` : ''}</div>`)}
          ${city ? html`<div><dt>${t.madeIn}</dt><dd>${city}, ${fmt.short(date)}</dd></div>` : ''}
        </dl>`,
    },

    /* ===== 4. Mặt B: hồi âm và xin một bài ===== */
    {
      id: 'hoi-am', label: 'Hồi âm', provides: ['rsvp'],
      render: ctx => html`
        <p class="mat">${ctx.texts.sideB}</p>
        <p class="dan">${ctx.texts.rsvpLead}</p>
        ${rsvpForm(ctx, { yes: 'Sẽ đến chung vui', no: 'Tiếc là không đến được', submit: 'Gửi hồi âm', wish: false, noteLabel: ctx.texts.songLabel, notePlaceholder: ctx.texts.songPlaceholder })}
        <p class="da-xin" role="status" hidden></p>`,
      mount(el, ctx) {
        const line = el.querySelector('.da-xin');
        ctx.on('rsvp', x => {
          const song = String(x.note || '').trim();
          line.hidden = !song;
          if (song) line.textContent = `Bài “${song}” ${ctx.data.texts?.songAdded || 'đã vào danh sách phát của tiệc cưới.'}`;
        });
      },
    },

    /* ===== 5. Mừng cưới và lời đề tặng ===== */
    {
      id: 'qua-tang', label: 'Mừng cưới và lời chúc', provides: ['gift', 'guestbook'],
      render: ctx => html`
        ${ctx.has('gift') ? html`
          <h2>${ctx.texts.giftTitle}</h2>
          <div class="tai-khoan">${ctx.accounts.map(a => {
            const qr = qrUrl(a, plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50));
            return html`
              <article class="tk">
                <p class="ai">${a.who}</p>
                ${qr ? html`<img class="qr" src="${qr}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="180" height="180">` : ''}
                <p><b>${a.bank}</b></p>
                <p class="so-tk"><span>${a.number}</span><button type="button" class="chep" data-copy="${a.number}">Chép số</button></p>
                <p>${a.name}</p>
              </article>`;
          })}</div>` : ''}
        <h2>${ctx.texts.wishTitle}</h2>
        ${wishForm(ctx, { submit: 'Gửi lời chúc' })}
        ${wishList(ctx)}`,
      mount(el, ctx) {
        if (ctx.guest) {
          const note = encodeURIComponent(`Mung cuoi ${plain(ctx.guest)}`.slice(0, 50));
          el.querySelectorAll('img.qr').forEach(img => { img.src = img.src.replace(/addInfo=[^&]*/, `addInfo=${note}`); });
        }
        el.querySelectorAll('.chep').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
          setTimeout(() => { b.textContent = 'Chép số'; }, 2000);
        }));
      },
    },

    /* ===== 6. Lời hẹn ===== */
    {
      id: 'loi-hen', kind: 'finale', label: 'Lời hẹn',
      render: ({ names: n, texts: t, city, img, guest, date }) => {
        const [a, rest = ''] = (t.goodbye || '').split('{k}');
        const [b, c] = rest.split('{c}');
        const src = img('thanks', 0);
        return html`
          ${src ? html`<img src="${src}" alt="" loading="lazy">` : ''}
          <div class="hc">
            <p class="hc-chu">${a}${guest()}${c !== undefined ? html`${b}${city || n.second}${c}` : b}</p>
            <p class="hc-nho">${n.first} và ${n.second} · ${fmt.short(date)}</p>
          </div>`;
      },
    },
  ],
});

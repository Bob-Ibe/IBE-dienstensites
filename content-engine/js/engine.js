// Gedrag van de Content Engine-pagina's: stippenveld, logo-morph, overgangen, rustig binnenkomen, reels, call-knoppen.
(function () {
  const hero = document.getElementById('hero-dots');
  if (hero && window.IBEDots) IBEDots(hero, { theme: 'dark', lion: null }); // alleen nog een zachte textuur, de leeuw zit in de morph
  const morph = document.getElementById('hero-morph');
  // onder de leeuw de namen van de pakketten
  if (morph && window.IBEMorph) IBEMorph(morph, { theme: 'dark', shapes: ['leeuw', 'orb', 'kubus-producten', 'camera', 'play'], words: ['Aandrijving', 'Versnelling', 'Volle kracht'] });
  if (window.IBEDither) document.querySelectorAll('canvas.fx-dither').forEach((c) => IBEDither(c, { top: c.dataset.top, bottom: c.dataset.bottom, mode: c.dataset.mode }));
  if (window.IBEFx) {
    IBEFx.words('.hero h1, .head h2, .problem .big');
    IBEFx.highlight('.hl', 'zwerm'); // zwarte site: zwerm van dots rond de belangrijke woorden
    IBEFx.count('.stat b, .fact b, .pack .count');
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 }) : null;
  document.querySelectorAll('.rv, .decay').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  // reels spelen zodra ze in beeld zijn, geluid aan/uit per reel
  const vio = 'IntersectionObserver' in window ? new IntersectionObserver((en) => en.forEach((e) => { const v = e.target; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.4 }) : null;
  document.querySelectorAll('.phone video').forEach((v) => {
    if (vio) vio.observe(v);
    // leeuw-loader tot de video echt kan spelen
    if (window.IBELoader && v.readyState < 2) {
      const ov = document.createElement('div'); ov.className = 'vload'; ov.append(IBELoader.make('zoeken', 46));
      v.after(ov);
      let gone = false;
      const done = () => { if (gone) return; gone = true; ov.classList.add('gone'); setTimeout(() => ov.remove(), 450); };
      ['loadeddata', 'canplay', 'playing', 'error'].forEach((ev) => v.addEventListener(ev, done, { once: true }));
      setTimeout(done, 4000); // nooit langer dan een paar seconden voor de video hangen
    }
    v.play().catch(() => {});
  });
  document.querySelectorAll('.phone .snd').forEach((b) => b.addEventListener('click', () => {
    const v = b.parentElement.querySelector('video');
    document.querySelectorAll('.phone video').forEach((o) => { if (o !== v) { o.muted = true; o.parentElement.querySelector('.snd').innerHTML = ICON.off; } });
    v.muted = !v.muted; if (!v.muted) v.play().catch(() => {});
    b.innerHTML = v.muted ? ICON.off : ICON.on;
  }));
  const ICON = {
    off: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m23 9-6 6M17 9l6 6"/></svg>',
    on: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
  };
  document.querySelectorAll('.phone .snd').forEach((b) => (b.innerHTML = ICON.off));

  // Wat het je oplevert: vier woorden die uit rode dots ontstaan, één voor één van links naar rechts terwijl je scrolt
  // (zelfde idee als de prijzen op de AI-site). De woorden staan als gewone tekst in de HTML; zonder beweging blijft dat zo.
  (function dotWords() {
    const box = document.getElementById('dot-words'); if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = box.querySelector('canvas'), ctx = cv.getContext('2d'), words = [...box.querySelectorAll('.dw')];
    const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), ease = (t) => 1 - Math.pow(1 - t, 3);
    box.classList.add('dots-on');
    let W = 0, H = 0, dpr = 1, pts = [], on = false, ready = false;
    function build() {
      dpr = Math.min(2, devicePixelRatio || 1); W = box.clientWidth; H = box.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      const b = box.getBoundingClientRect(); pts = [];
      words.forEach((el, wi) => {
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), gap = Math.max(2.6, fs / 13);
        const w = Math.ceil(r.width) + 6, h = Math.ceil(r.height) + 6, oc = document.createElement('canvas'); oc.width = w; oc.height = h;
        const o = oc.getContext('2d'); o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; o.textBaseline = 'middle'; o.fillText(el.textContent, 0, h / 2);
        const px = o.getImageData(0, 0, w, h).data, ox = r.left - b.left, oy = r.top - b.top - 3;
        for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) {
          if (px[((y | 0) * w + (x | 0)) * 4 + 3] < 120) continue;
          const tx = ox + x, ty = oy + y;
          pts.push({ tx, ty, sx: tx + (Math.random() - 0.5) * 260, sy: ty - 80 - Math.random() * 220, d: Math.random() * 0.3 + (x / w) * 0.15, s: Math.random() * 6.283, r: gap * 0.36, w: wi });
        }
      });
      ready = true;
    }
    function draw(now) {
      if (!on) return;
      requestAnimationFrame(draw);
      if (!ready) return;
      const t = now / 1000, b = box.getBoundingClientRect();
      // over een stuk scrollen van ongeveer een halve schermhoogte komen de vier woorden na elkaar binnen
      const all = clamp((innerHeight * 0.95 - b.top) / (innerHeight * 0.6)) * words.length;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const paths = {};
      for (const p of pts) {
        const wp = clamp(all - p.w * 0.85); if (wp <= 0) continue;
        const k = clamp((wp - p.d) / 0.55), e = ease(k), free = 1 - e;
        const x = p.sx + (p.tx - p.sx) * e + Math.sin(t * 1.2 + p.s) * free * 18;
        const y = p.sy + (p.ty - p.sy) * e + Math.cos(t * 0.9 + p.s) * free * 10 + (e === 1 ? Math.sin(t * 2.2 + p.tx * 0.05) * 0.5 : 0);
        const a = Math.round((0.15 + 0.85 * e) * Math.min(1, wp * 3) * 8) / 8;
        (paths[a] || (paths[a] = [])).push(x, y, p.r * (0.7 + 0.3 * e));
      }
      for (const a in paths) {
        const L = paths[a]; ctx.fillStyle = `rgba(255,107,118,${a})`; ctx.beginPath();
        for (let i = 0; i < L.length; i += 3) { ctx.moveTo(L[i] + L[i + 2], L[i + 1]); ctx.arc(L[i], L[i + 1], L[i + 2], 0, 6.283); }
        ctx.fill();
      }
    }
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { const was = on; on = en[0].isIntersecting; if (on && !was) requestAnimationFrame(draw); }, { rootMargin: '200px' }).observe(box);
    else { on = true; requestAnimationFrame(draw); }
    let rt = 0;
    const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 120); };
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(box); else addEventListener('resize', rebuild);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
  })();

  // contactgegevens uit config.js
  const c = window.IBE_CONFIG || {};
  document.querySelectorAll('[data-c]').forEach((el) => {
    const k = el.dataset.c;
    if (k === 'tel') { el.href = 'tel:' + c.tel; el.querySelector('b').textContent = c.phone; }
    if (k === 'wa') el.href = 'https://wa.me/' + c.wa;
    if (k === 'mail') { el.href = 'mailto:' + c.mail; el.querySelector('b').textContent = c.mail; }
  });
  document.querySelectorAll('[data-call]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault(); IBEForm.call(window.__formData ? window.__formData() : {});
    if (window.IBELoader) IBELoader.busy(b, 'Agenda openen', 'luisteren', 1600);
  }));
})();

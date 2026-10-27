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
    IBEFx.sticky('Plan een meeting', '#start', '#start');
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

  // Wat het je oplevert: vier reels die als een ring ronddraaien terwijl je scrolt (zelfde idee als de ring op de AI-site).
  // Alleen de reel vooraan speelt af. Zonder beweging of op een heel laag scherm blijven het vier reels naast elkaar.
  (function reelRing() {
    const sec = document.getElementById('oplevert'); if (!sec) return;
    const pin = sec.querySelector('.reel-pin'), stage = sec.querySelector('.reel-stage'), cards = [...stage.querySelectorAll('.reel')], n = cards.length;
    const vids = cards.map((r) => r.querySelector('video'));
    const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || innerHeight < 560) {
      vids.forEach((v) => { v.preload = 'metadata'; if (vio) vio.observe(v); });
      return;
    }
    sec.classList.add('reel-on');
    const dotsEl = document.getElementById('reel-dots');
    dotsEl.innerHTML = cards.map(() => '<i></i>').join('');
    const dots = [...dotsEl.children], STEP = 58;
    let R = 0, top = 0, len = 1, cur = -1, ticking = false, inView = false;
    function size() {
      const vh = innerHeight;
      sec.style.height = Math.round(vh + (n - 1) * vh * 0.5 + vh * 0.3) + 'px';
      R = clamp(Math.max(stage.clientWidth * 0.3, cards[0].offsetWidth * 0.95), 130, 420);
      top = sec.getBoundingClientRect().top + scrollY;
      len = Math.max(1, sec.offsetHeight - pin.offsetHeight);
      draw();
    }
    const settle = (t) => { const k = clamp((t - 0.2) / 0.6); return k * k * (3 - 2 * k); };
    function play() { vids.forEach((v, i) => { if (i === cur && inView) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }); }
    function draw() {
      ticking = false;
      const raw = clamp((scrollY - top) / len) * (n - 0.5) - 0.25;
      const r = clamp(raw, 0, n - 1), f = Math.floor(r), p = Math.min(n - 1, f + settle(r - f));
      cards.forEach((el, i) => {
        const d = i - p, a = (d * STEP * Math.PI) / 180;
        const front = (Math.cos(a) + 1) / 2, vis = clamp(2.7 - Math.abs(d));
        const x = Math.sin(a) * R * 1.15, z = (Math.cos(a) - 1) * R * 1.1, y = d * 24 - (1 - front) * R * 0.3;
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${(Math.sin(a) * 34).toFixed(2)}deg) rotateZ(${(d * -3).toFixed(2)}deg)`;
        el.style.opacity = (vis * (0.18 + 0.82 * Math.pow(front, 1.6))).toFixed(3);
        el.style.filter = front > 0.995 ? 'none' : `blur(${((1 - front) * 5).toFixed(1)}px)`;
        el.style.zIndex = Math.round(front * 100);
      });
      const now = Math.round(p);
      if (now !== cur) {
        cur = now;
        document.getElementById('reel-n').textContent = String(now + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
        dots.forEach((dt, i) => dt.classList.toggle('on', i === now));
        cards.forEach((el, i) => el.classList.toggle('front', i === now));
        play();
      }
    }
    dotsEl.addEventListener('click', (e) => { const i = dots.indexOf(e.target); if (i >= 0) scrollTo({ top: top + (len * (i + 0.25)) / (n - 0.5), behavior: 'smooth' }); });
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { inView = en[0].isIntersecting; play(); }).observe(stage);
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    addEventListener('resize', size);
    if (document.fonts) document.fonts.ready.then(size);
    size();
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

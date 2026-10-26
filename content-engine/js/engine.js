// Gedrag van de Content Engine-pagina's: stippenveld, logo-morph, overgangen, rustig binnenkomen, reels, call-knoppen.
(function () {
  const hero = document.getElementById('hero-dots');
  if (hero && window.IBEDots) IBEDots(hero, { theme: 'dark', lion: null }); // alleen nog een zachte textuur, de leeuw zit in de morph
  const morph = document.getElementById('hero-morph');
  // onder de leeuw de namen van de pakketten
  if (morph && window.IBEMorph) IBEMorph(morph, { theme: 'dark', shapes: ['leeuw', 'orb', 'kubus', 'camera', 'play'], words: ['Aandrijving', 'Versnelling', 'Volle kracht'] });
  if (window.IBEDither) document.querySelectorAll('canvas.fx-dither').forEach((c) => IBEDither(c, { top: c.dataset.top, bottom: c.dataset.bottom, mode: c.dataset.mode }));
  if (window.IBEFx) {
    IBEFx.words('.hero h1, .head h2, .problem .big');
    IBEFx.highlight('.hl', 'zwerm'); // zwarte site: zwerm van dots rond de belangrijke woorden
    IBEFx.count('.stat b, .fact b, .pack .count');
    IBEFx.sticky('Start de inventarisatie', '#start', '#start');
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 }) : null;
  document.querySelectorAll('.rv, .decay').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  // reels spelen zodra ze in beeld zijn, geluid aan/uit per reel
  const vio = 'IntersectionObserver' in window ? new IntersectionObserver((en) => en.forEach((e) => { const v = e.target; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.4 }) : null;
  document.querySelectorAll('.phone video').forEach((v) => {
    if (vio) vio.observe(v);
    // leeuw-loader tot de video echt kan spelen
    if (window.IBELoader && v.readyState < 3) {
      const ov = document.createElement('div'); ov.className = 'vload'; ov.append(IBELoader.make('zoeken', 46));
      v.after(ov);
      const done = () => { ov.classList.add('gone'); setTimeout(() => ov.remove(), 450); };
      v.addEventListener('canplay', done, { once: true }); v.addEventListener('error', done, { once: true });
    }
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

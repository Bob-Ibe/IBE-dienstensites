// IBE MOTION · gedeelde effecten voor beide dienstensites (zelfde bestand in beide mappen).
// IBEMorph:  de leeuw van dots die morpht naar andere vormen (header), met woorden eronder.
// IBELoader: de leeuw als kleine loader, vier standen: denken, zoeken, luisteren, maken.
// IBEDither: overgang tussen een lichte en donkere sectie die in dots oplost.
// IBEFx:     koppen die woord voor woord binnenkomen, cijfers die optellen, vaste belknop op mobiel.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mix = (a, b, t) => `rgb(${(a[0] + (b[0] - a[0]) * t) | 0},${(a[1] + (b[1] - a[1]) * t) | 0},${(a[2] + (b[2] - a[2]) * t) | 0})`;
  const RED = [232, 52, 66], WHITE = [255, 236, 228], DEEP = [120, 18, 28], INK = [17, 19, 26], SAND = [216, 170, 160];

  // Het logo-masker één keer laden, voor alle onderdelen
  let maskP = null;
  function lionMask() {
    if (!maskP) maskP = new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = window.IBE_LION_MASK; });
    return maskP;
  }
  // Alleen tekenen als het element in beeld is
  function watch(el) {
    const st = { on: true };
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { st.on = en[0].isIntersecting; }, { rootMargin: '80px' }).observe(el);
    return st;
  }

  /* ---------------- logo-morph ---------------- */
  // IBEMorph(host, { theme, shapes: ['leeuw', 'orb', ...], words: ['Tijdswinst', ...] })
  // Vormen: leeuw, orb, kubus, camera, play, zandloper, netwerk. Platte vormen (leeuw, camera, play) kijken naar voren en golven.
  const SHAPE_FLAT = { leeuw: 1, camera: 1, play: 1 }, SHAPE_BREATHE = { orb: 1 };
  function IBEMorph(host, opt) {
    opt = Object.assign({ theme: 'dark', hold: 3.6, dur: 2.3, shapes: ['leeuw', 'orb', 'kubus', 'camera', 'play'], words: null }, opt || {});
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    const word = opt.words ? host.appendChild(Object.assign(document.createElement('span'), { className: 'ibe-morph-word' })) : null;
    const ctx = canvas.getContext('2d'), vis = watch(host), SH = opt.shapes;
    const FL = SH.map((s) => SHAPE_FLAT[s] || 0), BR = SH.map((s) => SHAPE_BREATHE[s] || 0);
    let N = 2000, W = 0, H = 0, dpr = 1, targets = null, cur = 0, from = 0, mStart = -1, holdStart = performance.now();
    let last = performance.now(), angle = 0, mouse = null, energy = 0, wi = 0;
    let ox, oy, delay, seed;
    const light = opt.theme === 'light';

    // Punten op volgorde van hoogte en hoek, zodat punt i in elke vorm ongeveer op dezelfde plek zit: dan stroomt de morph
    const order = (a) => a.sort((p, q) => (Math.round(p[1] * 14) - Math.round(q[1] * 14)) || (Math.atan2(p[2], p[0]) - Math.atan2(q[2], q[0])));
    const rs = () => Math.random() - 0.5;
    function sphere() {
      const a = [];
      for (let i = 0; i < N; i++) { const y = 1 - ((i + 0.5) / N) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996, R = 0.78 + rs() * 0.05; a.push([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R]); }
      return a;
    }
    function cube() {
      const s = 0.56, a = [], V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
      for (let i = 0; i < N; i++) {
        const [p, q] = E[i % 12], t = Math.random(), r = 0.055 * Math.sqrt(Math.random()), u = Math.random() * 6.283, v = Math.acos(2 * Math.random() - 1);
        const off = [Math.sin(v) * Math.cos(u), Math.sin(v) * Math.sin(u), Math.cos(v)];
        a.push([0, 1, 2].map((k) => (V[p][k] + (V[q][k] - V[p][k]) * t) * s + r * off[k]));
      }
      return a;
    }
    // zandloper: glas, boven- en onderplaat, drie staanders en zand dat naar beneden loopt
    function hourglass() {
      const a = [], rg = (y) => 0.07 + 0.43 * Math.pow(Math.abs(y) / 0.72, 0.85);
      for (let i = 0; i < N; i++) {
        const k = i / N, u = Math.random() * 6.283;
        if (k < 0.46) { const y = rs() * 1.44, r = rg(y); a.push([Math.cos(u) * r, y, Math.sin(u) * r]); }
        else if (k < 0.62) { const y = (k < 0.54 ? 0.8 : -0.8) + rs() * 0.05, r = 0.58 * Math.sqrt(Math.random()); a.push([Math.cos(u) * r, y, Math.sin(u) * r]); }
        else if (k < 0.72) { const p = (i % 3) * 2.094, y = rs() * 1.6; a.push([Math.cos(p) * 0.56, y, Math.sin(p) * 0.56]); }
        else if (k < 0.92) { const y = -0.72 + Math.random() * 0.36, r = rg(y) * 0.88 * Math.sqrt(Math.random()); a.push([Math.cos(u) * r, y, Math.sin(u) * r]); }
        else if (k < 0.97) { const y = 0.28 + Math.random() * 0.22, r = rg(y) * 0.8 * Math.sqrt(Math.random()); a.push([Math.cos(u) * r, y, Math.sin(u) * r]); }
        else a.push([rs() * 0.02, -0.36 + Math.random() * 0.64, rs() * 0.02]);
      }
      return a;
    }
    // netwerk van tools: een hub in het midden, tools eromheen, lijnen ertussen
    function network() {
      const nodes = [[0, 0, 0, 0.17], [0.7, 0.05, 0, 0.11], [-0.7, -0.05, 0, 0.11], [0, 0.66, 0.1, 0.11], [0, -0.66, -0.1, 0.11], [0.1, 0, 0.7, 0.11], [-0.1, 0, -0.7, 0.11], [0.48, 0.46, -0.42, 0.09], [-0.48, -0.44, 0.44, 0.09]];
      const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [1, 3], [3, 2], [2, 4], [4, 1], [5, 1], [6, 2], [7, 3], [8, 4], [5, 8], [6, 7]];
      const a = [];
      for (let i = 0; i < N; i++) {
        if (i % 20 < 9) {
          // tool: klein blokje (punten op het oppervlak van een kubus)
          const [x, y, z, s] = nodes[i % nodes.length], f = (Math.random() * 6) | 0, u = rs() * 2 * s, v = rs() * 2 * s, w = (f % 2 ? 1 : -1) * s;
          a.push(f < 2 ? [x + w, y + u, z + v] : f < 4 ? [x + u, y + w, z + v] : [x + u, y + v, z + w]);
        } else {
          const [p, q] = edges[i % edges.length], t = Math.random(), A = nodes[p], B = nodes[q];
          a.push([A[0] + (B[0] - A[0]) * t + rs() * 0.015, A[1] + (B[1] - A[1]) * t + rs() * 0.015, A[2] + (B[2] - A[2]) * t + rs() * 0.015]);
        }
      }
      return a;
    }
    // Een plat logo of icoon (op een canvas) omzetten naar dots. Helderheid = diepte, zodat bijv. de lens naar voren komt.
    function fromCanvas(c, size, depth) {
      const w = c.width, h = c.height, px = c.getContext('2d').getImageData(0, 0, w, h).data, pool = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, b = (px[k] + px[k + 1] + px[k + 2]) / 765; if (b > 0.35) pool.push([x, y, b]); }
      const s = size / Math.max(w, h), a = [];
      for (let i = 0; i < N; i++) {
        const [x, y, b] = pool[(Math.random() * pool.length) | 0];
        a.push([(x + rs() - w / 2) * s, (y + rs() - h / 2) * s, (depth ? (b - 0.5) * depth : 0) + rs() * 0.1]);
      }
      return a;
    }
    function pad(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const o = c.getContext('2d'); o.fillStyle = o.strokeStyle = '#fff'; draw(o); return c; }
    const rrect = (o, x, y, w, h, r) => { o.beginPath(); o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r); o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath(); };
    const lion = (img) => fromCanvas(pad(img.width, img.height, (o) => o.drawImage(img, 0, 0)), 1.65);
    // camera van voren, in lijnen: body met zoeker, een lens die naar voren komt (lichter = dichterbij) en een flitser
    const camera = () => fromCanvas(pad(220, 180, (o) => {
      o.strokeStyle = '#9a9a9a'; o.lineWidth = 13; o.lineJoin = 'round';
      rrect(o, 14, 50, 192, 116, 26); o.stroke();
      o.beginPath(); o.moveTo(40, 50); o.lineTo(52, 24); o.lineTo(98, 24); o.lineTo(110, 50); o.stroke();
      o.strokeStyle = '#fff'; o.lineWidth = 15; o.beginPath(); o.arc(110, 108, 42, 0, 6.283); o.stroke();
      o.fillStyle = '#d8d8d8'; o.beginPath(); o.arc(110, 108, 19, 0, 6.283); o.fill();
      o.fillStyle = '#fff'; o.beginPath(); o.arc(176, 76, 8, 0, 6.283); o.fill();
    }), 1.62, 0.55);
    // play-knop: ring met een driehoek
    const play = () => fromCanvas(pad(200, 200, (o) => {
      o.lineWidth = 16; o.beginPath(); o.arc(100, 100, 88, 0, 6.283); o.stroke();
      o.beginPath(); o.moveTo(80, 58); o.lineTo(80, 142); o.lineTo(148, 100); o.closePath(); o.lineJoin = 'round'; o.lineWidth = 10; o.fill(); o.stroke();
    }), 1.55);
    const GEN = { orb: sphere, kubus: cube, camera, play, zandloper: hourglass, netwerk: network };

    function resize() { const r = host.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; }
    function setWord() {
      if (!word) return;
      word.classList.remove('on');
      setTimeout(() => { word.textContent = opt.words[wi++ % opt.words.length]; word.classList.add('on'); }, word.textContent ? 260 : 0);
    }
    function next() {
      from = cur; cur = (cur + 1) % SH.length; mStart = performance.now();
      host.dataset.shape = SH[cur]; setWord();
    }

    // Elke vorm draait in zijn eigen stand: platte vormen kijken naar voren en wiegen, 3D-vormen draaien rond.
    // De morph loopt tussen die twee standen in, dus er hoeft nooit snel bijgedraaid te worden.
    function pose(flat, t) { const ry = flat ? Math.sin(t * 0.7) * 0.28 : angle, rx = (flat ? 0 : 0.3) + Math.sin(t * 0.5) * 0.06; return [Math.cos(ry), Math.sin(ry), Math.cos(rx), Math.sin(rx)]; }
    const waveAt = (x, y, t) => Math.sin(x * 5 + t * 1.1) * Math.cos(y * 6 - t * 0.8) * 0.6 + Math.sin((x + y) * 3 - t * 0.6) * 0.4;
    function place(q, P, flat, br, t, out) {
      let x = q[0], y = q[1], z = q[2];
      if (flat) z += waveAt(x, y, t) * 0.09 * (1 + energy * 0.8); // golf door de platte vormen, zoals het doek in het Command Center
      if (br) { const k = 1 + Math.sin(t * 1.4 + y * 3) * 0.025; x *= k; y *= k; z *= k; }
      const x1 = x * P[0] + z * P[1], z1 = -x * P[1] + z * P[0];
      out[0] = x1; out[1] = y * P[2] - z1 * P[3]; out[2] = y * P[3] + z1 * P[2];
    }
    const qa = [0, 0, 0], qb = [0, 0, 0];

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = now / 1000;
      if (mStart < 0 && now - holdStart > opt.hold * 1000 && !reduce) next();
      let g = 1;
      if (mStart >= 0) { g = (now - mStart) / 1000 / opt.dur; if (g >= 1) { g = 1; mStart = -1; holdStart = now; from = cur; } }
      angle += dt * 0.5;
      energy += ((mouse ? 1 : 0) - energy) * 0.06;
      const PA = pose(FL[from], t), PB = pose(FL[cur], t);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const R = Math.min(W, H) * 0.46, X0 = W / 2, Y0 = H / 2, A = targets[from], B = targets[cur], dotBase = Math.max(0.6, W / 330);
      for (let i = 0; i < N; i++) {
        const p = g >= 1 ? 1 : ease(clamp((g - delay[i]) / 0.7));
        place(A[i], PA, FL[from], BR[from], t, qa);
        if (p > 0) place(B[i], PB, FL[cur], BR[cur], t, qb); else { qb[0] = qa[0]; qb[1] = qa[1]; qb[2] = qa[2]; }
        const drift = Math.sin(Math.PI * p) * 0.08;
        const x1 = qa[0] + (qb[0] - qa[0]) * p + Math.sin(seed[i] + t) * drift;
        const y1 = qa[1] + (qb[1] - qa[1]) * p + Math.cos(seed[i] * 1.3 + t) * drift;
        const z2 = qa[2] + (qb[2] - qa[2]) * p;
        const persp = 1 / (1 - z2 * 0.32);
        let px = X0 + x1 * R * persp, py = Y0 + y1 * R * persp, tx = 0, ty = 0;
        if (mouse) { const dx = px - mouse.x, dy = py - mouse.y, d = Math.hypot(dx, dy), RR = 46; if (d < RR && d > 0.01) { const f = (1 - d / RR) ** 2 * 16; tx = (dx / d) * f; ty = (dy / d) * f; } }
        ox[i] += (tx - ox[i]) * 0.14; oy[i] += (ty - oy[i]) * 0.14;
        px += ox[i]; py += oy[i];
        const flat = FL[from] + (FL[cur] - FL[from]) * p, depth = clamp((z2 + 0.9) / 1.8);
        const crest = depth + (clamp((waveAt(x1, y1, t) + 0.2) * 0.9) - depth) * flat; // kleur loopt mee met de morph, geen sprong
        const hl = clamp(crest * 0.95 + depth * 0.3 - 0.12 + energy * 0.12);
        ctx.fillStyle = light ? (hl > 0.5 ? mix(RED, INK, (hl - 0.5) * 1.4) : mix(SAND, RED, hl * 2)) : hl > 0.35 ? mix(RED, WHITE, (hl - 0.35) / 0.65) : mix(DEEP, RED, hl / 0.35);
        ctx.globalAlpha = 0.35 + depth * 0.6;
        const r = (0.55 + depth * 0.95) * dotBase;
        ctx.fillRect(px - r, py - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    }
    function loop(now) { if (vis.on && !document.hidden) frame(now); requestAnimationFrame(loop); }

    lionMask().then((img) => {
      resize();
      N = Math.round(clamp((W * H) / 45, 900, 2400));
      ox = new Float32Array(N); oy = new Float32Array(N); delay = new Float32Array(N); seed = new Float32Array(N);
      for (let i = 0; i < N; i++) { delay[i] = Math.random() * 0.3; seed[i] = Math.random() * 6.283; }
      targets = SH.map((s) => order(s === 'leeuw' ? lion(img) : GEN[s]()));
      host.dataset.shape = SH[0]; setWord();
      frame(performance.now());
      requestAnimationFrame(loop);
    });
    new ResizeObserver(() => targets && resize()).observe(host);
    host.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    host.addEventListener('pointerleave', () => { mouse = null; });
    host.addEventListener('click', () => { if (targets && mStart < 0) next(); });
    host.morphShow = (i) => { from = cur = i; host.dataset.shape = SH[i]; mStart = -1; holdStart = performance.now(); frame(performance.now()); }; // voor testen
    host.morphAt = (i, k) => { from = (i + SH.length - 1) % SH.length; cur = i; mStart = performance.now() - k * opt.dur * 1000; frame(performance.now()); mStart = -1; }; // voor testen: een tussenstand
  }

  /* ---------------- leeuw-loader ---------------- */
  // De leeuw als raster van dots, in het golfpatroon van het Command Center.
  // denken: valt uiteen en komt terug, met lijnen · zoeken: scanlijn · luisteren: golven vanuit het midden · maken: wordt een draaiende ring
  const MODES = ['denken', 'zoeken', 'luisteren', 'maken'];
  function IBELoader(canvas) {
    const size = Number(canvas.dataset.size) || 28, light = canvas.dataset.light != null;
    const dpr = Math.min(2, devicePixelRatio || 1), ctx = canvas.getContext('2d');
    canvas.classList.add('ibe-loader');
    canvas.style.width = canvas.style.height = size + 'px'; canvas.width = canvas.height = size * dpr;
    canvas.setAttribute('aria-hidden', 'true');
    lionMask().then((img) => {
      const G = Math.round(clamp(size * 0.42, 18, 40)), gh = Math.round((G * img.height) / img.width);
      const o = document.createElement('canvas'); o.width = G; o.height = gh;
      const oc = o.getContext('2d'); oc.drawImage(img, 0, 0, G, gh);
      const px = oc.getImageData(0, 0, G, gh).data, pts = [];
      for (let j = 0; j < gh; j++) for (let i = 0; i < G; i++) {
        const k = (j * G + i) * 4, b = (px[k] + px[k + 1] + px[k + 2]) / 765;
        if (b > 0.3) pts.push({ x: (i + 0.5 - G / 2) / (G / 2), y: (j + 0.5 - gh / 2) / (G / 2), b, s: Math.random() * 6.283, d: Math.random() });
      }
      // ringplek per dot, op volgorde van de hoek, zodat de leeuw netjes tot een ring oprolt
      pts.slice().sort((p, q) => Math.atan2(p.y, p.x) - Math.atan2(q.y, q.x)).forEach((p, i, a) => { p.ra = (i / a.length) * 6.283; });
      pts.forEach((p) => { p.n = (Math.random() * pts.length) | 0; });
      const T = 2.8, R = size * 0.42, C = size / 2, dot = Math.max(0.55, size / 70);
      function draw(now) {
        const mode = canvas.dataset.mode || 'denken', t = now / 1000, ph = (t % T) / T;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
        const pos = [], sc = Math.pow(Math.sin(Math.PI * ph), 3);
        for (const p of pts) {
          let x = p.x, y = p.y, z = 0, hl = 0, k = 1;
          const wave = Math.sin(x * 4 + t * 1.8) * Math.cos(y * 5 - t * 1.2) * 0.6 + Math.sin((x + y) * 2.5 - t) * 0.4;
          if (mode === 'denken') {
            x += Math.cos(p.s) * sc * 0.4 * (0.4 + p.d) + Math.sin(t * 1.3 + p.s) * sc * 0.08;
            y += Math.sin(p.s) * sc * 0.4 * (0.4 + p.d) + Math.cos(t * 1.1 + p.s) * sc * 0.08;
            k = 1 - sc * 0.35;
          } else if (mode === 'zoeken') {
            const sx = -1.3 + ph * 2.6, a = Math.sin(ph * 6.283) * 0.5;
            hl = Math.exp(-Math.pow((x - sx) / 0.18, 2));
            z = x * Math.sin(a) + hl * 0.15; x *= Math.cos(a);
          } else if (mode === 'luisteren') {
            const pulse = Math.max(0, Math.sin(Math.hypot(x, y) * 9 - t * 7));
            hl = pulse * 0.8; x *= 1 + pulse * 0.06; y *= 1 + pulse * 0.06;
          } else if (mode === 'maken') {
            const m = 0.5 - 0.5 * Math.cos(ph * 6.283), e = m * m * (3 - 2 * m);
            const a = p.ra + t * 2.4, rr = 0.72 + Math.sin(a * 3 + t * 4) * 0.03;
            x += (Math.cos(a) * rr - x) * e; y += (Math.sin(a) * rr - y) * e;
            hl = e * (0.5 + 0.5 * Math.sin(a * 2 - t * 6));
          }
          const per = 1 / (1 - z * 0.4), w = clamp(((wave + 1) / 2 - 0.3) * 1.5 * p.b + hl);
          pos.push([C + x * R * per, C + y * R * per, w, k]);
        }
        if (mode === 'denken' && sc > 0.05) {
          ctx.strokeStyle = light ? 'rgba(255,255,255,.55)' : 'rgba(232,52,66,.55)'; ctx.lineWidth = Math.max(0.4, size / 160); ctx.globalAlpha = sc * 0.6;
          ctx.beginPath();
          for (let i = 0; i < pts.length; i += 3) { const a = pos[i], b = pos[pts[i].n]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < size * 0.28) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
          ctx.stroke();
        }
        for (const [x, y, w, k] of pos) {
          ctx.globalAlpha = 0.55 + w * 0.45;
          ctx.fillStyle = light ? mix([255, 190, 190], [255, 255, 255], w) : w > 0 ? mix(RED, WHITE, w) : mix(DEEP, RED, 0.7);
          ctx.beginPath(); ctx.arc(x, y, dot * (0.75 + w * 0.6) * k, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      const loop = (now) => {
        if (!canvas.isConnected) return; // weggehaald uit de pagina: stoppen
        const r = canvas.getBoundingClientRect();
        if (r.width && r.bottom > 0 && r.top < innerHeight && !document.hidden) draw(now);
        requestAnimationFrame(loop);
      };
      draw(performance.now());
      if (!reduce) requestAnimationFrame(loop);
    });
    return canvas;
  }
  // Snel een loader als element maken: IBELoader.make('maken', 18, true)
  IBELoader.make = (mode, size, light) => {
    const c = document.createElement('canvas'); c.dataset.mode = mode || 'denken'; c.dataset.size = size || 24;
    if (light) c.dataset.light = '';
    return IBELoader(c);
  };
  IBELoader.MODES = MODES;
  // Knop even "bezig" laten zien: loader + tekst, daarna terug
  IBELoader.busy = (btn, text, mode, ms) => {
    if (!btn || btn.dataset.busy) return;
    const html = btn.innerHTML, w = btn.offsetWidth;
    btn.dataset.busy = '1'; btn.style.minWidth = w + 'px';
    btn.innerHTML = '';
    const light = getComputedStyle(btn).color.replace(/\s/g, '') === 'rgb(255,255,255)';
    btn.append(IBELoader.make(mode || 'maken', 18, light), Object.assign(document.createElement('span'), { textContent: text }));
    setTimeout(() => { btn.innerHTML = html; delete btn.dataset.busy; btn.style.minWidth = ''; }, ms || 1400);
  };

  /* ---------------- dither-overgang ---------------- */
  // IBEDither(canvas, { top: '#f7f6f2', bottom: '#0b0d12', mode: 'band' | 'rise' }) · de grens lost op in dots terwijl je scrolt.
  // 'rise': de onderste kleur komt van onder naar boven op terwijl je scrolt, en neemt zo de volgende sectie mee.
  function IBEDither(canvas, opt) {
    opt = Object.assign({ top: '#f7f6f2', bottom: '#0b0d12', cell: 11, mode: 'band' }, opt || {});
    const rise = opt.mode === 'rise';
    const ctx = canvas.getContext('2d'), vis = watch(canvas), S = opt.cell;
    let W = 0, H = 0, dpr = 1;
    const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
    const sm = (t) => t * t * (3 - 2 * t);
    function noise(x, y) {
      const i = Math.floor(x), j = Math.floor(y), fx = sm(x - i), fy = sm(y - j);
      const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }
    function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; }
    function draw(now) {
      const t = reduce ? 0 : now / 1000, r = canvas.getBoundingClientRect();
      const prog = clamp((innerHeight - r.top) / (innerHeight + r.height));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = opt.top; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = opt.bottom;
      const cols = Math.ceil(W / S) + 1, rows = Math.ceil(H / S) + 1;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        let v;
        if (rise) {
          // het front klimt mee met het scrollen; de ruis stijgt langzaam op, als bubbels
          const n = noise(i * 0.11, j * 0.1 + t * 0.45) * 0.7 + noise(i * 0.4 + t * 0.2, j * 0.4 + t * 0.9) * 0.3;
          v = (j / rows) * 1.5 - 1.55 + clamp(prog * 1.35) * 2.2 + (n - 0.5) * 0.8;
        } else {
          const n = noise(i * 0.09 + t * 0.15, j * 0.12 - t * 0.1) * 0.7 + noise(i * 0.35, j * 0.35 + t * 0.3) * 0.3;
          v = (j / rows) * 2 - 0.7 + (n - 0.5) * 0.9 + (prog - 0.5) * 1.1;
        }
        if (v <= 0.02) continue;
        const x = i * S, y = j * S;
        if (v >= 1) { ctx.fillRect(x - S / 2, y - S / 2, S + 0.5, S + 0.5); continue; }
        ctx.beginPath(); ctx.arc(x, y, S * 0.72 * Math.sqrt(v), 0, 6.283); ctx.fill();
      }
    }
    const loop = (now) => { if (vis.on && !document.hidden) draw(now); requestAnimationFrame(loop); };
    resize(); draw(performance.now());
    addEventListener('resize', () => { resize(); draw(performance.now()); });
    requestAnimationFrame(loop);
  }

  /* ---------------- kleine dingen ---------------- */
  const IBEFx = {
    // Koppen woord voor woord laten binnenkomen zodra ze in beeld komen (opmaak zoals <em> blijft staan)
    words(sel) {
      document.querySelectorAll(sel).forEach((el) => {
        let i = 0;
        const walk = (node) => {
          [...node.childNodes].forEach((n) => {
            if (n.nodeType === 3) {
              const frag = document.createDocumentFragment();
              n.textContent.split(/(\s+)/).forEach((part) => {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.append(part); return; }
                const s = document.createElement('span'); s.className = 'fx-w'; s.style.setProperty('--i', i++); s.textContent = part; frag.append(s);
              });
              n.replaceWith(frag);
            } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
          });
        };
        walk(el);
        el.classList.add('fx-words');
        if (reduce || !('IntersectionObserver' in window)) { el.classList.add('on'); return; }
        const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { el.classList.add('on'); io.disconnect(); } }, { threshold: 0.3 });
        io.observe(el);
      });
    },
    // Getallen in een tekst laten optellen zodra ze in beeld komen ("5 tot 30" telt beide op).
    // Past alleen de tekst zelf aan, zodat een highlight in hetzelfde element blijft staan.
    count(sel) {
      const RX = /\d+(?:[.,]\d+)?/g;
      document.querySelectorAll(sel).forEach((el) => {
        if (reduce || !('IntersectionObserver' in window)) return;
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
        while (tw.nextNode()) if (/\d/.test(tw.currentNode.nodeValue)) nodes.push([tw.currentNode, tw.currentNode.nodeValue]);
        if (!nodes.length) return;
        const render = (k) => nodes.forEach(([n, tpl]) => { n.nodeValue = tpl.replace(RX, (m) => Math.round(parseFloat(m.replace('.', '').replace(',', '.')) * k).toLocaleString('nl-NL')); });
        render(0);
        const io = new IntersectionObserver((en) => {
          if (!en[0].isIntersecting) return;
          io.disconnect();
          const t0 = performance.now();
          const step = (now) => { const k = clamp((now - t0) / 1100); render(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); else nodes.forEach(([n, tpl]) => (n.nodeValue = tpl)); };
          requestAnimationFrame(step);
        }, { threshold: 0.4 });
        io.observe(el);
      });
    },
    // Vaste knop onderin op mobiel; verdwijnt bij de inventarisatie zelf
    sticky(label, href, hideAt) {
      const a = Object.assign(document.createElement('a'), { className: 'fx-sticky', href, innerHTML: `<span>${label}</span><b>→</b>` });
      document.body.appendChild(a);
      const target = hideAt && document.querySelector(hideAt);
      let inTarget = false;
      if (target && 'IntersectionObserver' in window) new IntersectionObserver((en) => { inTarget = en[0].isIntersecting; upd(); }).observe(target);
      function upd() { a.classList.toggle('on', scrollY > innerHeight * 0.7 && !inTarget); }
      addEventListener('scroll', upd, { passive: true }); upd();
    },
  };

  /* ---------------- highlight van belangrijke woorden ---------------- */
  // IBEHighlight(el, 'marker' | 'zwerm'). Dots achter het woord, de tekst blijft er scherp bovenop.
  // marker: halftone-markeerstift met een golf erin (witte site) · zwerm: dots rond het woord die samentrekken en loslaten (zwarte site)
  function rrPoint(u, w, h, r) {
    const sx = w - r, sy = h - r, L = 4 * (sx + sy) + 2 * Math.PI * r; let d = (((u % 1) + 1) % 1) * L;
    const q = Math.PI * r / 2, arc = (a0, cx, cy) => (t) => { const a = a0 + t / r; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    const seg = [[2 * sx, (t) => [-sx + t, -h]], [q, arc(-Math.PI / 2, sx, -sy)], [2 * sy, (t) => [w, -sy + t]], [q, arc(0, sx, sy)],
      [2 * sx, (t) => [sx - t, h]], [q, arc(Math.PI / 2, -sx, sy)], [2 * sy, (t) => [-w, sy - t]], [q, arc(Math.PI, -sx, -sy)]];
    for (const [len, f] of seg) { if (d <= len) return f(d); d -= len; }
    return [-sx, -h];
  }
  const hash1 = (i) => { const s = Math.sin(i * 127.1) * 43758.5453; return s - Math.floor(s); };
  function IBEHighlight(el, variant) {
    if (el.dataset.hlOn) return; el.dataset.hlOn = '1';
    el.classList.add('hl');
    const c = document.createElement('canvas'); c.className = 'hl-canvas'; c.setAttribute('aria-hidden', 'true'); el.prepend(c);
    const ctx = c.getContext('2d');
    // is de achtergrond onder het woord donker? Zoek de eerste ouder met een echte achtergrondkleur.
    let bg = null;
    for (let n = el; n && n.nodeType === 1 && !bg; n = n.parentElement) { const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g); if (m && (m[3] === undefined || +m[3] > 0.5)) bg = m.map(Number); }
    if (!bg) bg = [255, 255, 255];
    const dark = (bg[0] * 0.3 + bg[1] * 0.59 + bg[2] * 0.11) < 128;
    let W = 0, H = 0, tw = 0, th = 0, dpr = 1, PX = 0, PY = 0, shown = false;
    function size() {
      const fs = parseFloat(getComputedStyle(el).fontSize); dpr = Math.min(2, devicePixelRatio || 1);
      tw = el.offsetWidth; th = el.offsetHeight; PX = fs * 0.5; PY = fs * 0.42; W = tw + PX * 2; H = th + PY * 2;
      Object.assign(c.style, { left: -PX + 'px', top: -PY + 'px', width: W + 'px', height: H + 'px' });
      c.width = W * dpr; c.height = H * dpr;
    }
    const col = (w) => dark ? (w > 0.5 ? mix(RED, WHITE, (w - 0.5) * 1.6) : mix(DEEP, RED, 0.4 + w * 1.2)) : (w > 0.5 ? mix(RED, INK, (w - 0.5) * 1.2) : mix([240, 170, 170], RED, w * 2));
    const dot = (x, y, r, w, a) => { ctx.globalAlpha = a; ctx.fillStyle = col(w); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); };
    const DRAW = {
      marker(t) {
        const fz = th * 0.8, S = Math.max(4, fz / 7), cols = Math.ceil(W / S), rows = Math.ceil(H / S);
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const x = i * S + S / 2, y = j * S + S / 2;
          const ex = Math.min(x - PX * 0.45, W - PX * 0.45 - x) / (PX * 0.9), ey = Math.min(y - PY * 0.95, H - PY * 0.6 - y) / (PY * 0.6);
          const edge = clamp(Math.min(ex, ey) + (hash1(i * 31 + j) - 0.5) * 0.9);
          if (edge <= 0.02) continue;
          const wave = (Math.sin(i * 0.45 - t * 2.4) * Math.cos(j * 0.6 + t * 1.3) + 1) / 2;
          dot(x, y, S * 0.42 * edge * (0.45 + wave * 0.6), wave * 0.6, dark ? 0.5 : 0.34);
        }
      },
      zwerm(t) {
        const fz = th * 0.8, n = Math.round(tw / 6) + 26, cx = W / 2, cy = H / 2, k = (Math.sin(t * 0.9) + 1) / 2, pts = [];
        for (let i = 0; i < n; i++) {
          const [rx, ry] = rrPoint(i / n, tw / 2 + PX * 0.3, th / 2 + PY * 0.38, Math.min(th * 0.3, tw * 0.2));
          const loose = (1 - k) * PX * 0.6, sd = i * 1.7;
          pts.push([cx + rx + Math.sin(t * 0.8 + sd) * loose, cy + ry + Math.cos(t * 0.7 + sd * 1.3) * loose * 0.6]);
        }
        ctx.strokeStyle = dark ? 'rgba(232,52,66,.35)' : 'rgba(232,52,66,.28)'; ctx.lineWidth = 0.7; ctx.globalAlpha = 0.4 + k * 0.4;
        ctx.beginPath(); for (let i = 0; i < n; i += 2) { const a = pts[i], b = pts[(i + 3) % n]; ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
        pts.forEach(([x, y], i) => { const w = (Math.sin(i * 0.7 - t * 3) + 1) / 2; dot(x, y, (0.9 + w * 1.2) * (fz / 32), w, 0.45 + w * 0.45); });
      },
    };
    const draw = DRAW[variant] || DRAW.marker;
    const vis = watch(el);
    function frame(now) {
      if (!el.isConnected) return;
      if (vis.on && !document.hidden && W) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); draw(reduce ? 1 : now / 1000); ctx.globalAlpha = 1; }
      if (!reduce) requestAnimationFrame(frame);
    }
    const start = () => { size(); frame(performance.now()); if (!reduce) requestAnimationFrame(frame); };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
    // meegroeien als het woord van maat verandert (cijfers die optellen, ander font, ander scherm)
    if ('ResizeObserver' in window) new ResizeObserver(() => W && size()).observe(el);
    else addEventListener('resize', size);
    // pas zichtbaar als het woord in beeld is (na het binnenkomen van de kop)
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver((en) => { if (en[0].isIntersecting && !shown) { shown = true; setTimeout(() => c.classList.add('on'), 450); io.disconnect(); } }, { threshold: 0.5 }); io.observe(el); }
    else c.classList.add('on');
  }
  IBEFx.highlight = (sel, variant) => document.querySelectorAll(sel).forEach((el) => IBEHighlight(el, el.dataset.hl || variant));

  window.IBEMorph = IBEMorph;
  window.IBEHighlight = IBEHighlight;
  window.IBELoader = IBELoader;
  window.IBEDither = IBEDither;
  window.IBEFx = IBEFx;
  // Loaders die al in de HTML staan meteen starten
  const boot = () => document.querySelectorAll('canvas[data-loader]').forEach((c) => { c.dataset.mode = c.dataset.mode || c.dataset.loader; IBELoader(c); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

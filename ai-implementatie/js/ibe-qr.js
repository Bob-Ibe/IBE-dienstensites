// IBE MOTION · boom (of camera) van blokjes die een QR-code wordt (footer, zelfde bestand in beide mappen).
// <div class="qr-tree" data-model="camera"> geeft de camera, zonder data-model de boom.
// Van opzij is het een boom in onze kleuren. Kantel je hem naar bovenaanzicht, dan staan de bladeren
// precies boven de donkere vakjes van de QR-code en scan je hem gewoon: hij gaat naar WhatsApp.
// De QR is vooraf gemaakt met tools/qrgen.py voor https://wa.me/31655116082 (en gecontroleerd met de QR-lezer van macOS).
// Verandert het nummer, maak de matrix dan opnieuw met dat script.
(function () {
  const QR = [
    '1111111000101010001111111',
    '1000001001111011001000001',
    '1011101011100010101011101',
    '1011101011000101101011101',
    '1011101010001010001011101',
    '1000001010011011101000001',
    '1111111010101010101111111',
    '0000000010010011000000000',
    '1011111001000101101111100',
    '0010010001000010000100010',
    '1010011001001001101111011',
    '1011100110111010011100001',
    '1101101010101101101110111',
    '1010010010100010000101010',
    '1010101111111001110111011',
    '1011100111010010100110001',
    '1000011010011100111110100',
    '0000000011101011100011000',
    '1111111001101110101010111',
    '1000001011111001100011011',
    '1011101011100101111110100',
    '1011101011011010011011111',
    '1011101011101000000001101',
    '1000001001101001110111001',
    '1111111011010100011111111',
  ];
  const Q = 3, N = QR.length, S = N + Q * 2; // 3 vakjes lichte rand eromheen, nodig om te kunnen scannen
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const dark = (x, z) => { const i = x - Q, j = z - Q; return i >= 0 && j >= 0 && i < N && j < N && QR[j][i] === '1'; };
  const inFinder = (x, z) => { const i = x - Q, j = z - Q; return (i < 7 && j < 7) || (i >= N - 7 && j < 7) || (i < 7 && j >= N - 7); };

  // vaste "willekeur", zodat de boom elke keer hetzelfde is
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Blokjes bouwen: [x, y, z, hoogte, kleur]
  const C = { leaf: ['#e0313f', '#c8202f', '#b01b29', '#d42a39'], hedge: '#8e1624', tuft: '#b8202e', trunk: '#3a2a26', ground: '#f1e9dc', soil: '#d9cbb5', soil2: '#c4b49b' };
  function treeModel() {
  const blocks = [];
  const cx = S / 2 - 0.5, cz = S / 2 - 0.5;
  for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) {
    if (!dark(x, z)) continue;
    const dx = x - cx, dz = z - cz, r2 = (dx * dx + dz * dz) / (9.4 * 9.4);
    if (inFinder(x, z)) { blocks.push([x, 0, z, 0.9, C.hedge]); continue; }
    if (r2 < 1) {
      // kruin: een bol van blokjes, alleen boven donkere vakjes
      for (let y = 5; y <= 17; y++) {
        const k = r2 + Math.pow((y - 11.4) / 5.4, 2);
        if (k < 1 - rnd() * 0.22) blocks.push([x, y * 0.82, z, 0.82, C.leaf[(rnd() * 4) | 0]]);
      }
      blocks.push([x, 0, z, 0.3, C.tuft]);
    } else blocks.push([x, 0, z, 0.3 + rnd() * 0.35, C.tuft]); // gras en bladeren op de grond
  }
  // stam in het midden (staat op een donker vakje, dus van boven niet te zien)
  const tc = Math.round(cx);
  for (let y = 0; y < 9; y++) blocks.push([tc, 0.3 + y * 0.82, tc, 0.82, C.trunk]);
  // een paar takken naar de kruin, ook alleen op donkere vakjes
  [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].forEach(([a, b], i) => { if (dark(tc + a, tc + b)) blocks.push([tc + a, 0.3 + (5 + (i % 3)) * 0.82, tc + b, 0.82, C.trunk]); });
  return blocks;
  }

  // Camera van blokjes. Anders dan de boom is hij dicht: de bovenkant van elk blokje krijgt de kleur van het QR-vakje
  // eronder (donker of licht), dus van boven zie je alleen de code. Van opzij zie je de camera, met de code als print erop.
  function cameraModel() {
    const L = 0.82, occ = new Map(), key = (x, k, z) => x + ',' + k + ',' + z;
    const put = (x, k, z, col) => { if (x >= 0 && z >= 0 && x < S && z < S && k >= 0) occ.set(key(x, k, z), col); };
    const BODY = '#2a2c33', STRIPE = '#e83442', LENS = '#16171b', RING = '#454852', REEL = '#e83442', REEL2 = '#b8202e', VF = '#33363e';
    for (let x = 6; x <= 22; x++) for (let z = 11; z <= 19; z++) for (let k = 0; k <= 8; k++) put(x, k, z, k === 4 ? STRIPE : BODY);
    for (let x = 16; x <= 20; x++) for (let k = 4; k <= 8; k++) put(x, k, 10, VF); // zoeker achterop
    for (let z = 20; z <= 24; z++) for (let x = 8; x <= 16; x++) for (let k = 0; k <= 9; k++) {
      const y = 0.3 + (k + 0.5) * L, r = z === 24 ? 3.4 : 2.8, d = Math.hypot(x - 12, y - 4);
      if (d <= r && !(z === 24 && d < 1.4)) put(x, k, z, z === 24 ? RING : LENS);
    }
    for (const xc of [10, 18]) for (let x = xc - 4; x <= xc + 4; x++) for (let z = 14; z <= 16; z++) for (let k = 9; k <= 19; k++) {
      const y = 0.3 + (k + 0.5) * L, d = Math.hypot(x - xc, y - 11.6);
      if (d <= 3.7 && d >= 1.1) put(x, k, z, (x + k) % 2 ? REEL : REEL2);
    }
    const out = [];
    for (const [kk, col] of occ) {
      const [x, k, z] = kk.split(',').map(Number);
      const top = dark(x, z) ? '#17181c' : '#f1e9dc';
      // alleen zijkanten en bovenkanten die niet tegen een ander blokje aan zitten
      out.push([x, 0.3 + k * L, z, L, col, top, { t: !occ.has(key(x, k + 1, z)), px: !occ.has(key(x + 1, k, z)), nx: !occ.has(key(x - 1, k, z)), pz: !occ.has(key(x, k, z + 1)), nz: !occ.has(key(x, k, z - 1)) }]);
    }
    // donkere vakjes op de grond die niet onder de camera liggen
    for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) if (dark(x, z) && !occ.has(key(x, 0, z))) out.push([x, 0, z, 0.14, '#17181c', '#17181c']);
    return out;
  }
  let TREE = null, CAM = null;

  function IBEQr(wrap) {
    const canvas = wrap.querySelector('canvas'), ctx = canvas.getContext('2d'), hint = wrap.querySelector('.qr-hint');
    const cam = wrap.dataset.model === 'camera', name = cam ? 'de camera' : 'de boom';
    const blocks = cam ? (CAM = CAM || cameraModel()) : (TREE = TREE || treeModel());
    // rechtsboven een grapje met een gebogen pijl naar de boom; verdwijnt als de QR-code in beeld is
    if (!cam) wrap.insertAdjacentHTML('beforeend', '<div class="qr-note" aria-hidden="true"><span>Dit is een spar :)</span><svg viewBox="0 0 90 70" fill="none"><path d="M78 6 C 82 34, 60 56, 18 58" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 6"/><path d="M27 50 L 15 58 L 27 65" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>');
    let W = 0, dpr = 1, yaw = Math.PI / 4, k = 0, from = 0, to = 0, t0 = 0, vis = false, auto = 0, last = performance.now();

    function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; canvas.width = canvas.height = W * dpr; }
    function setTarget(v) {
      from = k; to = v; t0 = performance.now();
      if (hint) hint.innerHTML = v ? `Scan met je telefoon · <b>klik voor ${name}</b>` : `Klik op ${name} · <b>scan voor WhatsApp</b>`;
      wrap.classList.toggle('is-qr', !!v);
    }

    function draw(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (t0) { const g = clamp((now - t0) / 1600); k = from + (to - from) * ease(g); if (g >= 1) t0 = 0; }
      // draaien als boom; naar bovenaanzicht netjes recht (veelvoud van 90 graden)
      if (to === 0 && !reduce) yaw += dt * 0.35 * (1 - k);
      else { const tgt = Math.round(yaw / (Math.PI / 2)) * (Math.PI / 2); yaw += (tgt - yaw) * Math.min(1, dt * 4); }
      const pitch = (26 + 64 * k) * Math.PI / 180;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const zoom = (W / S) * (0.6 + 0.35 * k), X0 = W / 2, Y0 = W / 2 + W * 0.06 * (1 - k);
      const P = (x, y, z) => { const ux = x - S / 2, uz = z - S / 2, rx = ux * cy - uz * sy, rz = ux * sy + uz * cy; return [X0 + rx * zoom, Y0 + (rz * sp - y * cp) * zoom, rz * cp + y * sp]; };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);

      const faces = [];
      // zichtbare zijkanten: normaal die naar de kijker wijst
      const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([nx, nz]) => nx * sy + nz * cy > 0.001);
      const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); return `rgb(${(((n >> 16) & 255) * f) | 0},${(((n >> 8) & 255) * f) | 0},${((n & 255) * f) | 0})`; };
      function box(x, y, z, w, h, d, col, top, vis) {
        const x1 = x + w, y1 = y + h, z1 = z + d;
        const depth = P(x + w / 2, y + h / 2, z + d / 2)[2];
        if (!vis || vis.t) faces.push({ d: depth + h * 0.001, c: top || col, p: [P(x, y1, z), P(x1, y1, z), P(x1, y1, z1), P(x, y1, z1)] });
        if (cp < 0.02) return;
        for (const [nx, nz] of sides) {
          if (vis && !(nx > 0 ? vis.px : nx < 0 ? vis.nx : nz > 0 ? vis.pz : vis.nz)) continue;
          const f = nx ? 0.78 : 0.62;
          const q = nx > 0 ? [[x1, z], [x1, z1]] : nx < 0 ? [[x, z1], [x, z]] : nz > 0 ? [[x1, z1], [x, z1]] : [[x, z], [x1, z]];
          faces.push({ d: depth - 0.01, c: shade(col, f), p: [P(q[0][0], y1, q[0][1]), P(q[1][0], y1, q[1][1]), P(q[1][0], y, q[1][1]), P(q[0][0], y, q[0][1])] });
        }
      }
      // de bak met aarde, en de lichte vakjes erop
      box(0, -1.2, 0, S, 1.2, S, C.soil, C.ground);
      const base = faces.splice(0);
      for (const b of blocks) box(b[0], b[1], b[2], 1, b[3], 1, b[4], b[5] || b[4], b[6]);
      faces.sort((a, b) => a.d - b.d);
      for (const f of base.concat(faces)) {
        ctx.fillStyle = f.c; ctx.beginPath();
        ctx.moveTo(f.p[0][0], f.p[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(f.p[i][0], f.p[i][1]);
        ctx.closePath(); ctx.fill();
        if (k < 0.98) { ctx.strokeStyle = f.c; ctx.lineWidth = 0.6; ctx.stroke(); } // naadjes dicht
      }
    }
    const loop = (now) => { if (vis && !document.hidden) draw(now); requestAnimationFrame(loop); };

    resize(); draw(performance.now());
    new ResizeObserver(() => { resize(); draw(performance.now()); }).observe(canvas);
    canvas.addEventListener('click', () => { clearTimeout(auto); setTarget(to ? 0 : 1); });
    setTarget(0);
    // eerst even de boom laten draaien, dan vanzelf naar de QR-code
    if ('IntersectionObserver' in window) {
      let first = true;
      new IntersectionObserver((en) => {
        vis = en[0].isIntersecting;
        if (vis && first) { first = false; auto = setTimeout(() => setTarget(1), 3200); }
      }, { threshold: 0.3 }).observe(canvas);
    } else { vis = true; setTarget(1); }
    requestAnimationFrame(loop);
    wrap.qrShow = (v) => { if (!v) yaw = Math.PI / 4; setTarget(v); t0 = 0; k = v; draw(performance.now()); }; // voor testen
  }

  window.IBEQr = IBEQr;
  const boot = () => document.querySelectorAll('.qr-tree').forEach(IBEQr);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

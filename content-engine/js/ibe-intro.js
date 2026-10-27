// IBE MOTION · openingsanimatie (zelfde opbouw als in het Command Center).
// 1. het dotpatroon loopt van rechtsboven naar linksonder over het scherm, met de leeuw erin;
// 2. alles wordt grijs en er draait een vizier rond de leeuw (geen tekst in de hoeken);
// 3. de leeuw pulseert twee keer rood, glitcht en trekt samen tot een fel punt;
// 4. een schokgolf opent het scherm en de dots vliegen naar de randen van de blokken op de pagina.
// Overslaan met klik, Esc, spatie of Enter. Speelt een keer per bezoek (sessie); ?intro forceert hem.
//
// Gebruik: IBEIntro.play({ title: 'IBE MOTION // CONTENT ENGINE', head: '> opstarten',
//   lines: [{ label: 'REELS', v: '5 tot 30 per maand' }, ...], online: 'ENGINE ONLINE', land: '[data-land]' })
(function () {
  const T = { fill: 1300, grey: 450, pulse: 1100, implode: 380, wave: 650, land: 1050 }; // ms per fase
  const S = {}; let TOTAL = 0;
  for (const k of Object.keys(T)) { S[k] = TOTAL; TOTAL += T[k]; }
  const RED = [232, 52, 66], WHITE = [255, 236, 228], GREY = [96, 99, 110], DARK = [52, 55, 63], CYAN = [70, 220, 255];
  const MONO = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace';
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const mixA = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const mix = (a, b, t) => `rgb(${mixA(a, b, t).join(',')})`;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const ease = (x) => 1 - (1 - x) ** 3;
  const easeIn = (x) => x ** 3;
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  function shouldPlay(key) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (/[?&]intro\b/.test(location.search)) return true;
    try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, '1'); } catch (e) {}
    return true;
  }

  function play(opt) {
    opt = Object.assign({ title: 'IBE MOTION', head: '> opstarten', lines: [], online: 'SYSTEM ONLINE', land: '[data-land]', key: 'ibe-intro:' + location.pathname }, opt || {});
    if (!shouldPlay(opt.key) || !window.IBE_LION_MASK) return Promise.resolve();
    try { document.fonts && document.fonts.load(`500 11px ${MONO}`); } catch (e) {}
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'ibe-intro';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<canvas></canvas>';
      document.body.appendChild(el);
      document.documentElement.classList.add('ibe-intro-on');
      const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = innerWidth, H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      const gap = Math.max(11, Math.round(Math.min(W, H) / 62));
      const cx = W / 2, cy = H / 2, maxD = Math.hypot(W, H) / 2;
      let dots = [], t0 = 0, raf = 0, done = false, land = null, landed = false;
      let lion = { x: cx, y: cy, size: Math.min(W, H) * 0.64 };

      const img = new Image();
      img.onload = () => { try { build(); } catch (e) { return finish(); } t0 = performance.now(); raf = requestAnimationFrame(frame); };
      img.onerror = () => finish();
      img.src = window.IBE_LION_MASK;

      function build() {
        const cols = Math.ceil(W / gap) + 1, rows = Math.ceil(H / gap) + 1;
        const size = Math.min(W, H) * 0.64, ar = img.width / img.height;
        const lw = ar >= 1 ? size : size * ar, lh = ar >= 1 ? size / ar : size;
        const lx = (W - lw) / 2, ly = (H - lh) / 2 - H * 0.02;
        lion = { x: lx + lw / 2, y: ly + lh / 2, size };
        const off = document.createElement('canvas');
        off.width = cols; off.height = rows;
        const o = off.getContext('2d');
        o.drawImage(img, lx / gap, ly / gap, lw / gap, lh / gap);
        const px = o.getImageData(0, 0, cols, rows).data;
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const k = (j * cols + i) * 4, b = (px[k] + px[k + 1] + px[k + 2]) / 765;
          const x = i * gap, y = j * gap;
          dots.push({ x, y, b: b > 0.2 ? b : 0, delay: ((W - x) + y) / (W + H), d: Math.hypot(x - cx, y - cy) });
        }
      }

      // Fase 1-3: het doek met de leeuw, inclusief glitch en implosie
      function drawField(e) {
        const pFill = clamp(e / T.fill), pGrey = clamp((e - S.grey) / T.grey), pImp = clamp((e - S.implode) / T.implode);
        const ePulse = e - S.pulse;
        const pulse = ePulse > 0 && ePulse < T.pulse ? Math.max(0, Math.sin((ePulse / T.pulse) * Math.PI * 4 - Math.PI / 2) * 0.5 + 0.5) ** 1.6 : 0;
        const glitch = e > S.implode - 170 && e < S.implode + 150;
        const gSeed = Math.floor(e / 45), time = e / 1000;
        for (const d of dots) {
          const appear = clamp((pFill * 1.35 - d.delay) / 0.35);
          if (appear <= 0) continue;
          const z = Math.sin(d.x * 0.012 + time * 1.6) * Math.cos(d.y * 0.016 - time * 1.1);
          const lift = (z + 1) / 2;
          let x = d.x, y = d.y - z * gap * 0.35 * (1 - pGrey * 0.7);
          let r = gap * (d.b ? 0.2 + d.b * 0.22 : 0.1 + lift * 0.09) * ease(appear);
          let c, alpha = d.b ? 1 : 0.28 + lift * 0.42;
          if (d.b) {
            r *= 1 + pulse * 0.5;
            if (pGrey < 1) c = mixA(mixA(RED, WHITE, clamp((lift - 0.25) * 1.3 * d.b)), GREY, pGrey);
            else if (ePulse < T.pulse) c = mixA(GREY, mixA(RED, WHITE, pulse * 0.25), pulse);
            else c = mixA(RED, WHITE, 0.1);
          } else {
            c = mixA(mixA([110, 20, 30], RED, lift * 0.8), DARK, pGrey);
            alpha = alpha * (1 - pGrey) + (0.45 + lift * 0.25) * pGrey;
          }
          let split = 0;
          if (glitch) {
            const slice = Math.floor(y / (gap * 2.5));
            if (hash(slice * 7.3 + gSeed) > 0.62) x += (hash(slice + gSeed * 3.1) - 0.5) * gap * 6;
            if (d.b) split = gap * 0.35;
          }
          if (pImp > 0) {
            const k = easeIn(clamp(pImp * 1.45 - (d.d / maxD) * 0.45));
            x += (cx - x) * k; y += (cy - y) * k;
            r *= 1 - k * 0.55;
            if (d.b) c = mixA(c, WHITE, k * 0.6); else alpha *= 1 - k * 0.5;
          }
          if (alpha <= 0.01 || r <= 0.05) continue;
          if (split) {
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = rgba(CYAN, 1); ctx.beginPath(); ctx.arc(x + split, y, r, 0, 6.2832); ctx.fill();
            ctx.fillStyle = rgba(RED, 1); ctx.beginPath(); ctx.arc(x - split, y, r, 0, 6.2832); ctx.fill();
          }
          ctx.globalAlpha = alpha; ctx.fillStyle = `rgb(${c.join(',')})`;
          ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (pImp > 0) core(gap * (0.8 + ease(pImp) * 3.2), pImp);
      }

      function core(rad, a) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad * 3);
        g.addColorStop(0, rgba(WHITE, a)); g.addColorStop(0.25, rgba(RED, a * 0.9)); g.addColorStop(1, rgba(RED, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad * 3, 0, 6.2832); ctx.fill();
      }

      // HUD: alleen het vizier rond de leeuw. Hoekteksten en boot-log zijn bewust weggelaten.
      function drawHud(e) {
        const a = clamp((e - S.fill + 250) / 400) * (1 - clamp(((e - S.implode) / T.implode) * 2));
        if (a <= 0) return;
        const ePulse = e - S.pulse;
        const pulse = ePulse > 0 && ePulse < T.pulse ? Math.max(0, Math.sin((ePulse / T.pulse) * Math.PI * 4 - Math.PI / 2) * 0.5 + 0.5) ** 1.6 : 0;
        ctx.save();
        ctx.globalAlpha = a; ctx.lineWidth = 1;
        const R = lion.size * 0.6, rot = e / 1000;
        const ringCol = mixA([255, 255, 255], RED, pulse);
        ctx.strokeStyle = rgba(ringCol, 0.16 + pulse * 0.25);
        for (let i = 0; i < 72; i++) {
          const ang = (i / 72) * Math.PI * 2, l = i % 6 ? 4 : 9;
          ctx.beginPath(); ctx.moveTo(lion.x + Math.cos(ang) * R, lion.y + Math.sin(ang) * R);
          ctx.lineTo(lion.x + Math.cos(ang) * (R + l), lion.y + Math.sin(ang) * (R + l)); ctx.stroke();
        }
        ctx.lineWidth = 2; ctx.strokeStyle = rgba(ringCol, 0.5 + pulse * 0.4);
        for (const [a0, len, dir, rr] of [[0, 0.9, 1, R - 10], [2.4, 0.5, 1, R - 10], [4.1, 1.2, 1, R - 10], [1, 0.7, -1, R + 18], [3.8, 1.4, -1, R + 18]]) {
          const s = a0 + rot * 0.7 * dir;
          ctx.beginPath(); ctx.arc(lion.x, lion.y, Math.max(1, rr), s, s + len); ctx.stroke();
        }
        ctx.restore();
      }

      // Fase 4: schokgolf en landen op de blokken van de pagina
      function initLand() {
        const els = Array.from(document.querySelectorAll(opt.land));
        const rects = els.map((x) => ({ r: x.getBoundingClientRect(), rad: parseFloat(getComputedStyle(x).borderTopLeftRadius) || 0, n: 0, hit: 0 }))
          .filter(({ r }) => r.width > 24 && r.height > 16 && r.bottom > 0 && r.top < H && r.right > 0 && r.left < W);
        const per = rects.reduce((a, { r }) => a + 2 * (r.width + r.height), 0);
        const step = Math.max(gap * 1.25, per / 1100);
        const parts = [];
        rects.forEach((o, ri) => {
          const { left: x0, top: y0, width: w, height: h } = o.r, P = 2 * (w + h);
          o.n = Math.max(4, Math.round(P / step));
          for (let i = 0; i < o.n; i++) {
            let u = (i / o.n) * P, tx, ty;
            if (u < w) { tx = x0 + u; ty = y0; } else if ((u -= w) < h) { tx = x0 + w; ty = y0 + u; }
            else if ((u -= h) < w) { tx = x0 + w - u; ty = y0 + h; } else { u -= w; tx = x0; ty = y0 + h - u; }
            parts.push(particle(tx, ty, ri));
          }
        });
        if (!parts.length) for (let i = 0; i < 900; i++) {
          const ang = Math.random() * Math.PI * 2, dist = maxD * (1.1 + Math.random() * 0.4);
          parts.push(particle(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, -1));
        }
        return { rects, parts };
      }
      function particle(tx, ty, ri) {
        const dist = Math.hypot(tx - cx, ty - cy);
        const ang = Math.atan2(ty - cy, tx - cx) + (Math.random() - 0.5) * 1.3;
        return { tx, ty, ri, dist, c1x: cx + Math.cos(ang) * dist * 0.75, c1y: cy + Math.sin(ang) * dist * 0.75, delay: Math.random() * 120 + (dist / maxD) * 160 };
      }
      const bez = (p, t) => { const u = 1 - t; return [u * u * cx + 2 * u * t * p.c1x + t * t * p.tx, u * u * cy + 2 * u * t * p.c1y + t * t * p.ty]; };

      function drawLand(e) {
        if (!land) land = initLand();
        const eW = e - S.wave, pWave = clamp(eW / T.wave), pLand = clamp((e - S.land) / T.land);
        el.style.backgroundColor = 'transparent';
        const R = ease(pWave) * maxD * 1.25;
        const dim = 0.6 * (1 - ease(pLand));
        ctx.fillStyle = '#06070a'; ctx.fillRect(0, 0, W, H);
        if (R > 1) {
          ctx.globalCompositeOperation = 'destination-out';
          const g = ctx.createRadialGradient(cx, cy, Math.max(0, R - 60), cx, cy, R);
          g.addColorStop(0, `rgba(0,0,0,${1 - dim})`); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
          ctx.fillStyle = `rgba(0,0,0,${1 - dim})`; ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, R - 60), 0, 6.2832); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
        if (eW < 200) { ctx.fillStyle = `rgba(255,236,228,${0.3 * (1 - eW / 200)})`; ctx.fillRect(0, 0, W, H); }
        if (pWave < 0.35) core(gap * 4 * (1 - pWave), 1 - pWave / 0.35);
        const ra = 1 - pWave ** 1.5;
        if (ra > 0 && R > 1) {
          ctx.lineWidth = 26; ctx.strokeStyle = rgba(RED, 0.1 * ra); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
          ctx.lineWidth = 2;
          ctx.strokeStyle = rgba(RED, 0.9 * ra); ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, R - 5), 0, 6.2832); ctx.stroke();
          ctx.strokeStyle = rgba(CYAN, 0.6 * ra); ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, 6.2832); ctx.stroke();
          ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(WHITE, ra); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
          const R2 = ease(clamp(pWave * 1.25 - 0.25)) * maxD * 0.9;
          if (R2 > 1) {
            ctx.lineWidth = 1; ctx.setLineDash([2, 10]); ctx.strokeStyle = rgba(WHITE, 0.4 * ra);
            ctx.beginPath(); ctx.arc(cx, cy, R2, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
          }
        }
        const fade = 1 - clamp((pLand - 0.5) / 0.5);
        for (const o of land.rects) o.hit = 0;
        const pr = Math.max(1.2, gap * 0.13);
        for (const p of land.parts) {
          const q = clamp((eW - p.delay) / 700);
          if (q <= 0) continue;
          const [x, y] = bez(p, ease(q));
          if (q >= 1) {
            if (p.ri >= 0) land.rects[p.ri].hit++;
            const since = eW - p.delay - 700, flash = clamp(1 - since / 180);
            ctx.globalAlpha = fade * (0.75 + 0.25 * hash(p.tx + Math.floor(e / 70)));
            ctx.fillStyle = mix(RED, WHITE, 0.25 + flash * 0.75);
            ctx.beginPath(); ctx.arc(x, y, pr * (1 + flash), 0, 6.2832); ctx.fill();
          } else {
            const [px, py] = bez(p, ease(Math.max(0, q - 0.035)));
            ctx.globalAlpha = 0.85; ctx.strokeStyle = rgba(RED, 0.8); ctx.lineWidth = pr;
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
            ctx.fillStyle = rgba(WHITE, 1); ctx.beginPath(); ctx.arc(x, y, pr, 0, 6.2832); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        for (const o of land.rects) {
          const f = o.hit / o.n;
          if (f <= 0) continue;
          ctx.lineWidth = 1; ctx.strokeStyle = rgba(RED, 0.55 * f * fade);
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(o.r.left + 0.5, o.r.top + 0.5, o.r.width - 1, o.r.height - 1, o.rad); else ctx.rect(o.r.left, o.r.top, o.r.width, o.r.height);
          ctx.stroke();
        }
        if (!landed && eW > 900) {
          landed = true;
          document.body.classList.add('ibe-intro-land');
          setTimeout(() => document.body.classList.remove('ibe-intro-land'), 1300);
        }
      }

      function frame(now) {
        if (done) return;
        const e = now - t0;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        if (e < S.wave) { el.style.backgroundColor = ''; drawField(e); drawHud(e); } else drawLand(e);
        if (e >= TOTAL) return finish();
        raf = requestAnimationFrame(frame);
      }

      function finish() {
        if (done) return;
        done = true; cancelAnimationFrame(raf); clearTimeout(guard);
        el.classList.add('out');
        document.documentElement.classList.remove('ibe-intro-on');
        setTimeout(() => { el.remove(); resolve(); }, 260);
        removeEventListener('keydown', key);
      }
      const key = (e) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); finish(); } };
      el.addEventListener('pointerdown', finish);
      addEventListener('keydown', key);
      const guard = setTimeout(finish, 9000); // vangnet
      el.frameAt = (ms) => { cancelAnimationFrame(raf); clearTimeout(guard); frame(t0 + ms); cancelAnimationFrame(raf); }; // voor testen
    });
  }

  window.IBEIntro = { play };
})();

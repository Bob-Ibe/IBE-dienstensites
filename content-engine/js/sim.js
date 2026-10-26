// Testsimulator op de webshop-pagina: drie varianten tegelijk live, de cijfers kiezen de winnaar,
// het budget schuift mee en de maand erna komen er nieuwe varianten op basis van de winnaar.
(function () {
  const root = document.getElementById('sim');
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const nl = (n, d = 0) => n.toLocaleString('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d });

  const PRODUCTS = [
    { name: 'Gezichtsserum', sw: 'linear-gradient(135deg,#f1d8c8,#c9937a)', win: 1, vars: [
      { tag: 'PROBLEEM EERST', t: '"Droge huid in de winter?"', ctr: 1.2, cpa: 26 },
      { tag: 'RESULTAAT EERST', t: 'Voor en na, in vijf seconden', ctr: 2.6, cpa: 12 },
      { tag: 'DETAIL', t: 'Textuur in slow motion', ctr: 1.0, cpa: 31 } ],
      next: ['Voor en na, met een andere opening', 'Voor en na, korter: 8 seconden', 'Voor en na, met een klant in beeld'] },
    { name: 'Hardloopshirt', sw: 'linear-gradient(135deg,#2d3b4f,#7fb2e5)', win: 0, vars: [
      { tag: 'IN ACTIE', t: 'Buiten, in de regen, tempo', ctr: 2.3, cpa: 14 },
      { tag: 'CLOSE-UP', t: 'Stof, naden en ventilatie', ctr: 1.1, cpa: 27 },
      { tag: 'AANBOD', t: 'Prijs en levertijd in beeld', ctr: 1.4, cpa: 23 } ],
      next: ['In actie, maar dan bij nacht', 'In actie, met het aanbod erbij', 'In actie, andere muziek'] },
    { name: 'Geurkaars', sw: 'linear-gradient(135deg,#3d2a1e,#e9b872)', win: 2, vars: [
      { tag: 'SFEER', t: 'Avond, warm licht, rust', ctr: 1.3, cpa: 24 },
      { tag: 'UITPAKKEN', t: 'Doos open, eerste indruk', ctr: 1.0, cpa: 29 },
      { tag: 'CADEAU', t: '"Nog een cadeau nodig?"', ctr: 2.4, cpa: 13 } ],
      next: ['Cadeau, voor Moederdag', 'Cadeau, met inpakken erbij', 'Cadeau, met prijs in beeld'] },
  ];
  const DAYS = 14, TICK = 430; // 14 dagen in ongeveer 6 seconden
  let prod = 0, day = 0, timer = 0, ran = false;
  const LETTER = ['A', 'B', 'C'];

  $('sim-tabs').innerHTML = PRODUCTS.map((p, i) => `<button type="button" role="tab" data-p="${i}"><i style="background:${p.sw}"></i>${p.name}</button>`).join('');
  $('sim-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; prod = Number(b.dataset.p); reset(); run(); });
  $('sim-go').addEventListener('click', () => { reset(); run(); });

  function card(v, i, p) {
    return `<div class="vcard" data-i="${i}"><span class="flag">Variant ${LETTER[i]}</span>
      <div class="vthumb" style="background:${p.sw}"><span class="vplay"><svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M7 4.5v15l13-7.5z"/></svg></span><b>${v.t}</b><i class="vbar"></i></div>
      <small>${v.tag}</small><h4>${p.name}</h4>
      <div class="vmet"><div><span>Budget</span><b data-k="bud">€ 0</b></div><div><span>Klikratio</span><b data-k="ctr">-</b></div><div><span>Per verkoop</span><b data-k="cpa">-</b></div></div>
      <div class="vbud"><i style="width:0%"></i></div></div>`;
  }
  function reset() {
    clearInterval(timer); day = 0;
    const p = PRODUCTS[prod];
    $('sim-tabs').querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === prod));
    $('sim-cards').innerHTML = p.vars.map((v, i) => card(v, i, p)).join('');
    $('sim-prog').style.width = '0%'; $('sim-day').textContent = 'Dag 0'; $('sim-phase').textContent = 'Klaar om te starten';
    $('sim-go').innerHTML = 'Start de test <span class="arr">→</span>';
    steps(-1); log('Kies een product en druk op start.');
  }
  function steps(n) { $('sim-steps').querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', i === n)); }
  function log(txt, busy) {
    const el = $('sim-log'); el.replaceChildren();
    if (busy && window.IBELoader) el.append(IBELoader.make('denken', 20));
    el.append(txt);
  }
  // Cijfers lopen naar hun echte waarde: eerst veel ruis, na een paar dagen stabiel
  function noisy(target, d, seed) { const spread = 0.55 / Math.sqrt(d + 0.6); return target * (1 + Math.sin(d * 1.7 + seed * 2.3) * spread); }

  function run() {
    const p = PRODUCTS[prod], cards = [...$('sim-cards').children];
    ran = true;
    $('sim-go').textContent = 'Opnieuw';
    cards.forEach((c) => c.classList.add('live'));
    steps(0); log('Alle drie live met € 10 per dag.', true);
    timer = setInterval(() => {
      day++;
      $('sim-day').textContent = 'Dag ' + Math.min(day, DAYS);
      $('sim-prog').style.width = (Math.min(day, DAYS) / DAYS) * 85 + '%';
      const shift = day > 7;
      $('sim-phase').textContent = shift ? 'Week 2 · budget naar de winnaar' : 'Week 1 · alles live';
      p.vars.forEach((v, i) => {
        const c = cards[i], won = i === p.win;
        const bud = !shift ? 10 : won ? 24 : day > 9 ? 0 : 4;
        c.querySelector('[data-k=bud]').textContent = '€ ' + bud;
        c.querySelector('[data-k=ctr]').textContent = nl(noisy(v.ctr, day, i), 1) + '%';
        c.querySelector('[data-k=cpa]').textContent = '€ ' + nl(noisy(v.cpa, day, i + 3));
        c.querySelector('.vbud i').style.width = (bud / 24) * 100 + '%';
        if (shift) { c.classList.toggle('win', won); c.classList.toggle('lose', !won); c.querySelector('.flag').textContent = won ? 'Winnaar' : day > 9 ? 'Gestopt' : 'Minder budget'; }
        if (day > 9 && !won) c.classList.remove('live');
      });
      const w = LETTER[p.win];
      if (day === 3) log(`Variant ${w} loopt voor, de rest komt nog op gang.`, true);
      if (day === 6) log('Na een week is het verschil duidelijk.', true);
      if (day === 8) { steps(1); log(`Budget naar variant ${w}. De andere twee krijgen minder en stoppen.`, true); }
      if (day === 12) log(`Variant ${w} haalt verkopen voor ongeveer € ${p.vars[p.win].cpa} per stuk.`, true);
      if (day === DAYS + 2) {
        clearInterval(timer);
        steps(2);
        $('sim-prog').style.width = '100%'; $('sim-phase').textContent = 'Maand 2 · verder bouwen'; $('sim-day').textContent = 'Maand 2';
        const keep = cards[p.win];
        let k = 0;
        cards.forEach((c, i) => {
          if (i === p.win) return;
          const n = document.createElement('div');
          n.innerHTML = card({ tag: 'NIEUW · OP BASIS VAN ' + w, t: p.next[k++] }, i, p);
          const nc = n.firstElementChild; nc.classList.add('new', 'live'); nc.querySelector('.flag').textContent = 'Nieuw';
          nc.querySelector('[data-k=bud]').textContent = '€ 10'; nc.querySelector('.vbud i').style.width = '42%';
          c.replaceWith(nc);
        });
        keep.querySelector('.flag').textContent = 'Winnaar blijft draaien';
        log(`Maand 2: twee nieuwe varianten op basis van ${w}. Zo wordt elke ronde beter.`);
      }
    }, TICK);
  }

  reset();
  // Speelt een keer vanzelf af zodra hij in beeld komt
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting && !ran) { io.disconnect(); run(); } }, { threshold: 0.45 });
    io.observe(root);
  }
})();

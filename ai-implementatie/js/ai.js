// Gedrag van de AI-pagina: morph, overgangen, je week voor en na, rekensom, branches met dashboard, VSL, contact.
(function () {
  const $ = (id) => document.getElementById(id);
  const nl = (n, d = 0) => n.toLocaleString('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d });
  const eur = (n) => '€ ' + nl(Math.round(n));
  const uur = (n) => (n > 0 && n < 1 ? Math.round(n * 60) + ' min' : nl(n, n % 1 ? (n * 10) % 1 ? 2 : 1 : 0) + ' uur');
  const c = window.IBE_CONFIG || {};
  const WEEKS = 46, RATE = 35, PRICE = 1500;

  if (window.IBEDots) {
    IBEDots($('hero-dots'), { theme: 'light', gap: 22 });
    IBEDots($('vsl-dots'), { theme: 'dark', lion: { x: 0.5, y: 0.5, size: 0.86 } });
  }
  // AI-site: zandloper (tijd) en een netwerk van tools, met onder de leeuw wat het de ondernemer oplevert
  if (window.IBEMorph) IBEMorph($('hero-morph'), { theme: 'light', shapes: ['leeuw', 'zandloper', 'kubus', 'camera', 'netwerk'], words: ['Tijdswinst', 'Efficiëntie', 'Overzicht', 'Minder fouten', 'Rust in je hoofd', 'Ruimte om te groeien'] });
  if (window.IBEDither) document.querySelectorAll('canvas.fx-dither').forEach((cv) => IBEDither(cv, { top: cv.dataset.top, bottom: cv.dataset.bottom, mode: cv.dataset.mode }));
  if (window.IBEFx) {
    IBEFx.words('.hero h1, .head h2');
    IBEFx.highlight('.hl', 'marker'); // witte site: halftone-marker achter de belangrijke woorden
    IBEFx.count('.guarantee .seal b');
    IBEFx.sticky('Plan een inventarisatie', '#start', '#start');
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 }) : null;
  document.querySelectorAll('.rv').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  // header: wat 5 tot 15 uur per jaar waard is
  // standaard 10 uur (het gemiddelde); het uurloon kun je zelf invullen
  $('w-r').value = 10;
  const worth = () => { const h = +$('w-r').value, rate = parseFloat($('w-rate').value) || 0; $('w-h').textContent = h + ' uur'; $('w-v').textContent = eur(h * WEEKS * rate); };
  $('w-r').addEventListener('input', worth); $('w-rate').addEventListener('input', () => { worth(); $('c-rate').value = $('w-rate').value; calc(); }); worth();

  /* ---------- je week, voor en na ---------- */
  // Per dag blokken van 8:00 tot 18:00. a = terugkerend computerwerk, s = uren die we eraf halen (samen 10 uur).
  const WEEK = [
    ['Ma', [['Mail en klantvragen', 1, 1, 0.75], ['Klantwerk', 3], ['Offertes maken', 1.5, 1, 1], ['Klantwerk', 2.5], ['Facturen en bonnetjes', 1, 1, 0.5], ['Planning', 1, 1, 0.5]]],
    ['Di', [['Mail en klantvragen', 1.5, 1, 0.75], ['Klantwerk', 4], ['Overtypen tussen systemen', 1, 1, 0.75], ['Klantwerk', 3], ['Afspraken heen en weer', 0.5, 1, 0.25]]],
    ['Wo', [['Mail en klantvragen', 1, 1, 0.75], ['Klantwerk', 3.5], ['Offertes maken', 1.5, 1, 0.75], ['Klantwerk', 3], ['Rapportage', 1, 1, 0.5]]],
    ['Do', [['Mail en klantvragen', 1, 1, 0.5], ['Klantwerk', 4], ['Facturen en bonnetjes', 1, 1, 0.75], ['Klantwerk', 3], ['Planning', 1, 1, 0.25]]],
    ['Vr', [['Mail en klantvragen', 1, 1, 0.5], ['Klantwerk', 3.5], ['Weekoverzicht maken', 1.5, 1, 1], ['Klantwerk', 2], ['Administratie bijwerken', 2, 1, 0.5]]],
  ];
  const AUTO = [['Mail gesorteerd, antwoord klaargezet', 0.12], ['Offertes in minuten', 0.3], ['Facturen verwerkt', 0.5], ['Systemen praten met elkaar', 0.68], ['Weekoverzicht staat klaar', 0.85]];
  const USE = [['Groei', '#c49a6c', (h) => `<b>${nl((h * WEEKS) / 40, 1)} werkweken</b> extra voor groei`],
    ['Klanten', '#5f9a7f', (h) => `<b>${nl(h * WEEKS)} uur</b> extra voor je klanten`],
    ['Familie', '#e0a458', (h) => `<b>${nl((h * WEEKS) / 4)} vrije middagen</b> met je familie`],
    ['Jezelf', '#8a9bd0', (h) => `<b>${nl(h * WEEKS)} uur</b> voor sport, rust of nieuwe ideeën`]];
  let use = 0;
  const TOTAL = WEEK.reduce((t, [, bl]) => t + bl.reduce((u, b) => u + (b[3] || 0), 0), 0);
  $('wk-grid').innerHTML = WEEK.map(([d, bl]) => `<div class="wk-day"><span class="wk-d">${d}</span><div class="wk-col">${bl.map((b) => b[2]
    ? `<div class="wk-b a" style="flex-grow:${b[1]}" data-d="${b[1]}" data-s="${b[3]}"><i class="wk-red"><span>${b[0]}</span></i><i class="wk-free"><span>vrij</span></i></div>`
    : `<div class="wk-b k" style="flex-grow:${b[1]}"><span>${b[0]}</span></div>`).join('')}</div></div>`).join('')
    + '<div class="wk-hours">' + Array.from({ length: 6 }, (_, i) => `<span>${8 + i * 2}:00</span>`).join('') + '</div>';
  $('wk-auto').innerHTML = AUTO.map(([t]) => `<span class="wk-a">${t}</span>`).join('');
  $('wk-use').innerHTML = USE.map(([l, col], i) => `<button type="button" class="${i === use ? 'on' : ''}" data-u="${i}" style="--c:${col}">${l}</button>`).join('');
  function week() {
    const v = +$('wk-r').value / 100, free = TOTAL * v;
    document.querySelectorAll('.wk-b.a').forEach((b) => {
      const d = +b.dataset.d, sv = +b.dataset.s * v;
      b.querySelector('.wk-red').style.flexGrow = d - sv;
      b.querySelector('.wk-free').style.flexGrow = sv;
      b.classList.toggle('freed', sv > 0.15);
    });
    document.querySelectorAll('.wk-a').forEach((el, i) => el.classList.toggle('on', v >= AUTO[i][1]));
    const h = Math.round(free * 2) / 2;
    $('wk-free').textContent = uur(h) + ' vrij';
    $('wk-days').textContent = v ? `Dat is ${nl(h / 8, 1)} werkdag per week` : 'Sleep de schuif naar "na"';
    $('wk-title-h').textContent = uur(Math.round(TOTAL));
    const [, col, txt] = USE[use];
    document.querySelector('.week').style.setProperty('--use', col);
    document.querySelectorAll('.wk-free span').forEach((s) => (s.textContent = USE[use][0].toLowerCase()));
    $('wk-year').innerHTML = v ? `Per jaar: ${txt(h)}.` : '&nbsp;';
  }
  $('wk-r').addEventListener('input', week);
  $('wk-use').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; use = +b.dataset.u; $('wk-use').querySelectorAll('button').forEach((x, i) => x.classList.toggle('on', i === use)); week(); });
  week();
  // Schuift een keer vanzelf open als de sectie in beeld komt, daarna is hij van jou
  if ('IntersectionObserver' in window) {
    const wio = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      wio.disconnect();
      if (+$('wk-r').value) return;
      const t0 = performance.now();
      const step = (now) => { const k = Math.min(1, (now - t0) / 2600); $('wk-r').value = Math.round(100 * (1 - Math.pow(1 - k, 3))); week(); if (k < 1) requestAnimationFrame(step); };
      setTimeout(() => requestAnimationFrame(step), 700);
    }, { threshold: 0.45 });
    wio.observe($('wk-grid'));
  }

  /* ---------- rekensom ---------- */
  let people = 3;
  function calc() {
    const h = +$('c-hours').value, rate = parseFloat($('c-rate').value) || 0;
    const week = h * people, year = week * WEEKS, value = year * rate;
    $('c-people').textContent = people + (people === 1 ? ' persoon' : ' personen');
    $('c-hv').textContent = h + ' uur';
    $('r-hours').textContent = nl(year) + ' uur';
    $('r-money').textContent = `± ${eur(value)} per jaar aan werk dat naar iets beters gaat`;
    $('r-week').textContent = nl(week) + ' uur';
    $('r-month').textContent = eur(value / 12);
    $('r-weeks').textContent = nl(year / 40);
    const pay = week * rate > 0 ? Math.ceil(PRICE / (week * rate)) : 0;
    $('r-pay').textContent = pay ? `${pay} ${pay === 1 ? 'week' : 'weken'}` : '-';
    const max = Math.max(PRICE, value);
    $('pb-in').style.width = (PRICE / max) * 100 + '%';
    $('pb-out').style.width = (value / max) * 100 + '%';
    $('pb-out-v').textContent = eur(value);
    $('r-means').textContent = `Dat zijn ${nl(year / 40)} volle werkweken per jaar. ${week >= 5 ? 'Binnen ons doel van 5 tot 15 uur per week.' : 'Ons doel is minimaal 5 uur per week, op het hele team.'} Gerekend met een traject vanaf ${eur(PRICE)}.`;
  }
  $('c-min').onclick = () => { people = Math.max(1, people - 1); calc(); };
  $('c-plus').onclick = () => { people = Math.min(50, people + 1); calc(); };
  $('c-hours').oninput = calc; $('c-rate').oninput = calc;
  calc();

  /* ---------- branches met dashboard ---------- */
  // Per taak: [taak, uren nu, uren straks]. Indicaties, geen meting.
  const BR = [
    { id: 'events', tab: 'Activiteiten en events', who: 'Klimhal of groepsuitje', intro: 'Klimhallen, escape rooms, groepsuitjes en andere zaken waar mensen een tijd boeken. Veel vragen, veel heen en weer, veel bevestigingen.',
      tasks: [['Boekingsvragen via mail en WhatsApp', 5, 1.5], ['Groepsaanvragen en offertes', 3, 0.5], ['Bevestigingen en herinneringen', 2, 0], ['Wachtlijst en omboekingen', 1.5, 0.5], ['Reviews vragen na een bezoek', 1, 0]],
      build: ['Een assistent die boekingsvragen beantwoordt met jullie eigen info en de echte beschikbaarheid', 'Groepsofferte in één klik vanuit de aanvraag', 'Bevestiging, herinnering en na afloop een reviewvraag, vanzelf', 'Een wachtlijst die zelf het vrijgekomen plekje aanbiedt'],
      sys: ['Recras of Bookeo', 'Gmail of Outlook', 'WhatsApp Business', 'Google Reviews', 'Mollie'] },
    { id: 'interieur', tab: 'Interieurzaken', who: 'Interieurzaak', intro: 'Winkels met maatwerk en leveranciers. De tijd zit in offertes, levertijden navragen en klanten op de hoogte houden.',
      tasks: [['Offertes op maat', 4, 1], ['Levertijden navragen bij leveranciers', 2.5, 0.5], ['Klant op de hoogte houden', 2, 0.5], ['Afspraken in de winkel plannen', 1.5, 0.5], ['Social posts en nieuwsbrief', 1.5, 0.5]],
      build: ['Offerte met jullie prijzen en productfoto\'s, klaar om te versturen', 'Een checker die leveranciersmails leest en de levertijd bijwerkt', 'Automatische updates naar de klant als er iets verandert', 'Afspraken maken via je site, rechtstreeks in de agenda'],
      sys: ['Lightspeed of je kassasysteem', 'Outlook', 'Excel', 'Leveranciersportalen', 'WhatsApp Business'] },
    { id: 'hovenier', tab: 'Hoveniers', who: 'Hoveniersbedrijf', intro: 'Veel buiten, en dan \'s avonds nog offertes, planning en facturen. Daar halen we het meeste weg.',
      tasks: [['Offertes na een bezoek', 4, 1], ['Planning per ploeg', 3, 1], ['Omboeken bij slecht weer', 1.5, 0.25], ['Uren en facturen verwerken', 2.5, 0.5], ['Onderhoudscontracten opvolgen', 1, 0.25]],
      build: ['Offerte uit je spraakmemo en de foto\'s van het bezoek', 'Weekplanning per ploeg die bij regen zelf een voorstel doet om te schuiven', 'Uren van de ploeg die vanzelf een factuur worden', 'Herinnering voor onderhoud, op tijd naar de klant'],
      sys: ['Gripp of Excel', 'Moneybird of Exact', 'Google Agenda', 'WhatsApp', 'Weerbericht'] },
    { id: 'garage', tab: 'Autogarages', who: 'Autogarage', intro: 'De werkplaats loopt, maar de telefoon en de administratie ook. Afspraken, herinneringen en "uw auto is klaar" kosten meer tijd dan je denkt.',
      tasks: [['Afspraken maken en verzetten', 3, 0.75], ['APK- en onderhoudsherinneringen', 1.5, 0], ['Onderdelen opzoeken en bestellen', 2, 1], ['Klant bellen dat de auto klaar is', 1.5, 0.25], ['Facturen en betalingen', 1.5, 0.5]],
      build: ['Online afspraken die meteen in je planning landen', 'APK-herinnering via WhatsApp of mail, vanzelf op tijd', '"Je auto is klaar" met factuur en betaallink in één bericht', 'Onderdelenlijst die klaarstaat vanuit de werkorder'],
      sys: ['Je garagesoftware', 'RDW-gegevens', 'WhatsApp Business', 'Google Agenda', 'Mollie'] },
    { id: 'makelaar', tab: 'Makelaars', who: 'Makelaarskantoor', intro: 'Veel mail, bezichtigingen inplannen en kopers en verkopers op de hoogte houden. En een uur van een makelaar is veel waard.',
      tasks: [['Vragen over woningen beantwoorden', 4, 1], ['Bezichtigingen plannen', 3, 0.5], ['Updates naar kopers en verkopers', 2, 0.5], ['Woningteksten schrijven', 2, 0.5], ['Dossier en documenten bijhouden', 2, 1]],
      build: ['Een assistent die vragen beantwoordt met de echte woninginfo', 'Bezichtigingen die zelf tijdsloten aanbieden en bevestigen', 'Elke week vanzelf een update naar de verkoper', 'Woningtekst uit je aantekeningen en de foto\'s'],
      sys: ['Realworks', 'Funda-aanvragen', 'Outlook', 'Google Agenda', 'Word-sjablonen'] },
  ];
  let br = 0;
  $('br-tabs').innerHTML = BR.map((b, i) => `<button type="button" role="tab" data-b="${i}" class="${i === br ? 'on' : ''}">${b.tab}</button>`).join('');
  function saved(b) { return b.tasks.reduce((t, x) => t + x[1] - x[2], 0); }
  function info(b) {
    const s = saved(b);
    return `<p class="br-intro">${b.intro}</p>
      <div class="br-table"><div class="br-row h"><span>Waar de tijd nu heen gaat</span><span>Nu</span><span>Straks</span></div>
      ${b.tasks.map(([t, a, z]) => `<div class="br-row"><span>${t}</span><span>${uur(a)}</span><span class="z">${uur(z)}</span></div>`).join('')}
      <div class="br-row t"><span>Terug per week</span><span></span><span>${uur(s)}</span></div></div>
      <p class="br-k">Wat we bouwen</p><ul class="br-build">${b.build.map((x) => `<li>${x}</li>`).join('')}</ul>
      <p class="br-k">Werkt met</p><div class="br-sys">${b.sys.map((x) => `<span>${x}</span>`).join('')}</div>`;
  }
  function dash(b) {
    const s = saved(b), goal = Math.round(s), wk = [0, 0, Math.round(s * 0.35 * 2) / 2, Math.round(s * 0.6 * 2) / 2, Math.round(s * 0.8 * 2) / 2, s * 0.9, s, s * 1.02, s * 0.97, s];
    const total = wk.reduce((t, v) => t + v, 0), max = Math.max(goal + 3, ...wk);
    return `<div class="kd-head"><b>KPI-dashboard · ${b.who}</b><span>Voorbeeld</span></div>
      <div class="kd-tiles">
        <div class="kd-tile hl"><small>Deze week</small><b>${nl(s, s % 1 ? 1 : 0)}<i>uur</i></b></div>
        <div class="kd-tile"><small>Doel</small><b>${goal}<i>uur</i></b></div>
        <div class="kd-tile"><small>Totaal</small><b>${nl(total)}<i>uur</i></b></div>
        <div class="kd-tile"><small>Waarde per jaar</small><b>${eur(s * WEEKS * RATE)}</b></div>
      </div>
      <div class="kd-chart"><div class="goal" style="bottom:${(goal / max) * 100}%"><span>DOEL ${goal} U</span></div><div class="goal g5" style="bottom:${(5 / max) * 100}%"><span>GARANTIE 5 U</span></div>
        ${wk.map((v, i) => `<i style="--h:${(v / max) * 100}%;--d:${i * 50}ms" title="${nl(v, 1)} uur"></i>`).join('')}</div>
      <div class="kd-x">${wk.map((_, i) => `<span>${i < 2 ? 'Nul' : 'W' + (i - 1)}</span>`).join('')}</div>
      <div class="kd-list">${b.tasks.slice(0, 3).map(([t, a, z]) => `<div><span>${t}</span><b>${uur(a - z)} terug</b></div>`).join('')}</div>`;
  }
  function showBranch(i, quick) {
    br = i; const b = BR[i];
    $('br-tabs').querySelectorAll('button').forEach((x, k) => x.classList.toggle('on', k === i));
    $('br-info').innerHTML = info(b);
    const d = $('br-dash');
    if (quick || !window.IBELoader) { d.innerHTML = dash(b); requestAnimationFrame(() => d.classList.add('grow')); return; }
    // even de leeuw-loader terwijl het dashboard "laadt"
    d.classList.remove('grow'); d.style.minHeight = d.offsetHeight + 'px';
    const l = document.createElement('div'); l.className = 'fx-load'; l.style.minHeight = d.offsetHeight - 56 + 'px';
    l.append(IBELoader.make('zoeken', 40), 'Dashboard laden');
    d.replaceChildren(l);
    setTimeout(() => { d.innerHTML = dash(b); d.style.minHeight = ''; requestAnimationFrame(() => d.classList.add('grow')); }, 420);
  }
  $('br-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showBranch(+b.dataset.b); });
  showBranch(0, true);

  /* ---------- VSL ---------- */
  $('vsl-len').textContent = 'Video · ' + (c.vslLength || '3 min');
  if (c.vsl) $('vsl-sub').textContent = 'Klik om af te spelen';
  $('vsl-play').onclick = () => {
    const box = $('vsl');
    if (!c.vsl) { location.hash = '#start'; return; }
    const yt = c.vsl.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/), vm = c.vsl.match(/vimeo\.com\/(\d+)/);
    if (yt) box.insertAdjacentHTML('beforeend', `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen title="Video"></iframe>`);
    else if (vm) box.insertAdjacentHTML('beforeend', `<iframe src="https://player.vimeo.com/video/${vm[1]}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen title="Video"></iframe>`);
    else { box.insertAdjacentHTML('beforeend', `<video src="${c.vsl}" controls autoplay playsinline></video>`); }
  };

  /* ---------- contact ---------- */
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

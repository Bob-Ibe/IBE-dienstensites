// Gedrag van de AI-pagina: morph, overgangen, je week voor en na, rekensom, ring met wat we overnemen,
// branches met dashboard, prijsopbouw met dots, VSL, contact. Teksten in twee talen via T('nl', 'en') (js/i18n.js).
(function () {
  const $ = (id) => document.getElementById(id);
  const I = window.IBEI18n || { t: (a) => a, en: false, num: (n) => String(n), eur: (n) => '€ ' + n };
  const T = I.t, EN = I.en;
  const nl = I.num, eur = I.eur;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const uur = (n) => (n > 0 && n < 1 ? Math.round(n * 60) + ' min'
    : nl(n, n % 1 ? (n * 10) % 1 ? 2 : 1 : 0) + (EN ? (n === 1 ? ' hour' : ' hours') : ' uur'));
  const weken = (w) => w + ' ' + T(w === 1 ? 'week' : 'weken', w === 1 ? 'week' : 'weeks');
  const c = window.IBE_CONFIG || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WEEKS = 46, RATE = 35, PRICE = 1500;

  if (window.IBEDots) {
    IBEDots($('hero-dots'), { theme: 'light', gap: 22 });
    IBEDots($('vsl-dots'), { theme: 'dark', lion: { x: 0.5, y: 0.5, size: 0.86 } });
  }
  // AI-site: zandloper (tijd) en een netwerk van tools, met onder de leeuw wat het de ondernemer oplevert
  if (window.IBEMorph) IBEMorph($('hero-morph'), { theme: 'light', shapes: ['leeuw', 'zandloper', 'kubus-persoon', 'puzzel', 'netwerk'],
    words: T(['Tijdswinst', 'Efficiëntie', 'Overzicht', 'Minder fouten', 'Rust in je hoofd', 'Ruimte om te groeien'], ['Time saved', 'Efficiency', 'Overview', 'Fewer mistakes', 'Peace of mind', 'Room to grow']) });
  if (window.IBEDither) document.querySelectorAll('canvas.fx-dither').forEach((cv) => IBEDither(cv, { top: cv.dataset.top, bottom: cv.dataset.bottom, mode: cv.dataset.mode }));
  if (window.IBEFx) {
    IBEFx.words('.hero h1, .head h2');
    IBEFx.highlight('.hl', 'marker'); // witte site: halftone-marker achter de belangrijke woorden
    IBEFx.count('.guarantee .seal b');
    IBEFx.sticky(T('Plan een inventarisatie', 'Book an intake'), '#start', '#start');
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 }) : null;

  // header: wat 5 tot 15 uur per jaar waard is
  // standaard 10 uur (het gemiddelde); het uurloon kun je zelf invullen
  $('w-r').value = 10;
  const worth = () => { const h = +$('w-r').value, rate = parseFloat($('w-rate').value) || 0; $('w-h').textContent = uur(h); $('w-v').textContent = eur(h * WEEKS * rate); };
  $('w-r').addEventListener('input', worth); $('w-rate').addEventListener('input', () => { worth(); $('c-rate').value = $('w-rate').value; calc(); }); worth();

  /* ---------- je week, voor en na ---------- */
  // Per dag blokken van 8:00 tot 18:00. a = terugkerend computerwerk, s = uren die we eraf halen (samen 10 uur).
  const MAIL = T('Mail en klantvragen', 'Email and questions'), KW = T('Klantwerk', 'Client work'), OFF = T('Offertes maken', 'Making quotes'),
    FAC = T('Facturen en bonnetjes', 'Invoices and receipts'), PLAN = T('Planning', 'Planning');
  const WEEK = [
    [T('Ma', 'Mon'), [[MAIL, 1, 1, 0.75], [KW, 3], [OFF, 1.5, 1, 1], [KW, 2.5], [FAC, 1, 1, 0.5], [PLAN, 1, 1, 0.5]]],
    [T('Di', 'Tue'), [[MAIL, 1.5, 1, 0.75], [KW, 4], [T('Overtypen tussen systemen', 'Retyping between systems'), 1, 1, 0.75], [KW, 3], [T('Afspraken heen en weer', 'Scheduling back and forth'), 0.5, 1, 0.25]]],
    [T('Wo', 'Wed'), [[MAIL, 1, 1, 0.75], [KW, 3.5], [OFF, 1.5, 1, 0.75], [KW, 3], [T('Rapportage', 'Reporting'), 1, 1, 0.5]]],
    [T('Do', 'Thu'), [[MAIL, 1, 1, 0.5], [KW, 4], [FAC, 1, 1, 0.75], [KW, 3], [PLAN, 1, 1, 0.25]]],
    [T('Vr', 'Fri'), [[MAIL, 1, 1, 0.5], [KW, 3.5], [T('Weekoverzicht maken', 'Weekly overview'), 1.5, 1, 1], [KW, 2], [T('Administratie bijwerken', 'Updating admin'), 2, 1, 0.5]]],
  ];
  const AUTO = [[T('Mail gesorteerd, antwoord klaargezet', 'Email sorted, reply drafted'), 0.12], [T('Offertes in minuten', 'Quotes in minutes'), 0.3], [T('Facturen verwerkt', 'Invoices processed'), 0.5], [T('Systemen praten met elkaar', 'Systems talk to each other'), 0.68], [T('Weekoverzicht staat klaar', 'Weekly overview ready'), 0.85]];
  const USE = [[T('Groei', 'Growth'), '#c49a6c', (h) => T(`<b>${nl((h * WEEKS) / 40, 1)} werkweken</b> extra voor groei`, `<b>${nl((h * WEEKS) / 40, 1)} work weeks</b> extra for growth`)],
    [T('Klanten', 'Customers'), '#5f9a7f', (h) => T(`<b>${nl(h * WEEKS)} uur</b> extra voor je klanten`, `<b>${nl(h * WEEKS)} hours</b> extra for your customers`)],
    [T('Familie', 'Family'), '#e0a458', (h) => T(`<b>${nl((h * WEEKS) / 4)} vrije middagen</b> met je familie`, `<b>${nl((h * WEEKS) / 4)} free afternoons</b> with your family`)],
    [T('Jezelf', 'Yourself'), '#8a9bd0', (h) => T(`<b>${nl(h * WEEKS)} uur</b> voor sport, rust of nieuwe ideeën`, `<b>${nl(h * WEEKS)} hours</b> for sport, rest or new ideas`)]];
  let use = 0;
  const TOTAL = WEEK.reduce((t, [, bl]) => t + bl.reduce((u, b) => u + (b[3] || 0), 0), 0);
  $('wk-grid').innerHTML = WEEK.map(([d, bl]) => `<div class="wk-day"><span class="wk-d">${d}</span><div class="wk-col">${bl.map((b) => b[2]
    ? `<div class="wk-b a" style="flex-grow:${b[1]}" data-d="${b[1]}" data-s="${b[3]}"><i class="wk-red"><span>${b[0]}</span></i><i class="wk-free"><span>${T('vrij', 'free')}</span></i></div>`
    : `<div class="wk-b k" style="flex-grow:${b[1]}"><span>${b[0]}</span></div>`).join('')}</div></div>`).join('')
    + '<div class="wk-hours">' + Array.from({ length: 6 }, (_, i) => `<span>${8 + i * 2}:00</span>`).join('') + '</div>';
  // Pixelmannetjes aan het werk in de blokken met klantwerk: box 1, 3 en 5 (bovenste rij) en 7 en 9 (onderste rij).
  // Elk doet iets anders op zijn scherm: planning, rapportage, offertes, facturen en administratie.
  (function workers() {
    const days = [...document.querySelectorAll('.wk-day')], spots = [[0, 0, 'planning'], [2, 0, 'rapportage'], [4, 0, 'offertes'], [1, 1, 'facturen'], [3, 1, 'administratie']];
    const SK = '#f0c3a0', HAIR = '#2a1d18', SHIRT = '#d2404c', DESK = '#5a4636', FRAME = '#2a2c33', SCREEN = '#0f1116', DIM = '#3a3d45', GREEN = '#6fe3a1', PAPER = '#d7dae2', GOLD = '#e0a458';
    const list = spots.map(([d, k, task], i) => {
      const box = days[d] && days[d].querySelectorAll('.wk-b.k')[k];
      if (!box) return null;
      const cv = document.createElement('canvas'); cv.className = 'wk-px'; cv.width = 32; cv.height = 24; cv.setAttribute('aria-hidden', 'true'); box.appendChild(cv);
      return { c: cv.getContext('2d'), task, seed: i * 1.7 };
    }).filter(Boolean);
    function draw(w, t) {
      const c = w.c, P = (x, y, ww, h, col) => { c.fillStyle = col; c.fillRect(x, y, ww, h); };
      const f = Math.floor(t * 6 + w.seed) % 4, slow = Math.floor(t * 1.5 + w.seed);
      c.clearRect(0, 0, 32, 24);
      // scherm
      P(17, 3, 13, 11, FRAME); P(18, 4, 11, 9, SCREEN); P(22, 14, 3, 2, FRAME);
      if (w.task === 'planning') { for (let i = 0; i < 6; i++) P(19 + (i % 3) * 3, 5 + Math.floor(i / 3) * 4, 2, 3, i === slow % 6 ? SHIRT : DIM); }
      if (w.task === 'rapportage') { for (let i = 0; i < 3; i++) { const h = 2 + ((f + i * 2) % 4) + i; P(19 + i * 3, 12 - h, 2, h, GREEN); } }
      if (w.task === 'offertes') { for (let i = 0; i < 3; i++) P(19, 5 + i * 2, Math.min(9, ((t * 7 + i * 4 + w.seed) % 12) | 0), 1, PAPER); P(26, 11, 2, 1, SHIRT); }
      if (w.task === 'facturen') { P(19, 5, 3, 1, GOLD); P(19, 6, 1, 3, GOLD); P(19, 9, 3, 1, GOLD); P(18, 7, 3, 1, GOLD); for (let i = 0; i < 3; i++) P(23, 5 + i * 2, 5, 1, slow % 3 === i ? GREEN : PAPER); }
      if (w.task === 'administratie') { P(19, 7, 4, 4, GOLD); P(19, 6, 2, 1, GOLD); P(24, 7, 4, 4, GOLD); P(24, 6, 2, 1, GOLD); const x = 20 + ((t * 4 + w.seed) % 6); P(Math.floor(x), 5, 2, 2, PAPER); }
      // bureau, toetsenbord en stoel
      P(0, 16, 32, 2, DESK); P(2, 18, 2, 6, DESK); P(28, 18, 2, 6, DESK); P(13, 15, 5, 1, '#8b909b'); P(3, 8, 2, 11, DIM);
      // het mannetje: kijkt naar zijn scherm, knikt af en toe en typt
      const hy = 4 + (f === 3 ? 1 : 0);
      P(7, hy, 5, 2, HAIR); P(7, hy + 2, 5, 3, SK); P(11, hy + 3, 1, 1, HAIR); P(6, hy + 1, 1, 2, HAIR);
      P(6, hy + 5, 7, 7, SHIRT); P(12, hy + 6, 3, 2, SHIRT);
      P(14, 15 - (f % 2), 2, 1, SK); P(16, 15 - ((f + 1) % 2), 2, 1, SK);
      P(7, 18, 2, 5, '#26282e'); P(10, 18, 2, 5, '#26282e');
    }
    let last = 0;
    const vis = { on: false };
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { vis.on = en[0].isIntersecting; }).observe($('wk-grid')); else vis.on = true;
    const loop = (now) => { if (vis.on && now - last > 110) { last = now; list.forEach((w) => draw(w, now / 1000)); } requestAnimationFrame(loop); };
    list.forEach((w) => draw(w, 0));
    if (!reduce) requestAnimationFrame(loop);
  })();
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
    $('wk-free').textContent = uur(h) + T(' vrij', ' free');
    $('wk-days').textContent = v ? T(`Dat is ${nl(h / 8, 1)} werkdag per week`, `That is ${nl(h / 8, 1)} working days a week`) : T('Sleep de schuif naar "na"', 'Drag the slider to "after"');
    $('wk-title-h').textContent = uur(Math.round(TOTAL));
    const [, col, txt] = USE[use];
    document.querySelector('.week').style.setProperty('--use', col);
    document.querySelectorAll('.wk-free span').forEach((s) => (s.textContent = USE[use][0].toLowerCase()));
    $('wk-year').innerHTML = v ? T('Per jaar: ', 'Per year: ') + txt(h) + '.' : '&nbsp;';
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
    $('c-people').textContent = people + T(people === 1 ? ' persoon' : ' personen', people === 1 ? ' person' : ' people');
    $('c-hv').textContent = uur(h);
    $('r-hours').textContent = uur(year);
    $('r-money').textContent = T(`± ${eur(value)} per jaar aan werk dat naar iets beters gaat`, `± ${eur(value)} a year of work that goes to something better`);
    $('r-week').textContent = uur(week);
    $('r-month').textContent = eur(value / 12);
    $('r-weeks').textContent = nl(year / 40);
    const pay = week * rate > 0 ? Math.ceil(PRICE / (week * rate)) : 0;
    $('r-pay').textContent = pay ? weken(pay) : '-';
    const max = Math.max(PRICE, value);
    $('pb-in').style.width = (PRICE / max) * 100 + '%';
    $('pb-out').style.width = (value / max) * 100 + '%';
    $('pb-in-v').textContent = eur(PRICE);
    $('pb-out-v').textContent = eur(value);
    $('r-means').textContent = T(`Dat zijn ${nl(year / 40)} volle werkweken per jaar. ${week >= 5 ? 'Binnen ons doel van 5 tot 15 uur per week.' : 'Ons doel is minimaal 5 uur per week, op het hele team.'} Gerekend met een traject vanaf ${eur(PRICE)}.`,
      `That is ${nl(year / 40)} full work weeks a year. ${week >= 5 ? 'Within our goal of 5 to 15 hours a week.' : 'Our goal is at least 5 hours a week, across the whole team.'} Calculated with a project from ${eur(PRICE)}.`);
  }
  $('c-min').onclick = () => { people = Math.max(1, people - 1); calc(); };
  $('c-plus').onclick = () => { people = Math.min(50, people + 1); calc(); };
  $('c-hours').oninput = calc; $('c-rate').oninput = calc;
  calc();

  /* ---------- wat we overnemen: draaiende ring ---------- */
  // De sectie blijft staan terwijl je scrolt; de 9 blokken draaien als een ring langs. Het voorste blok is scherp,
  // de rest vervaagt naar achteren. Elk blok komt één keer voor, daarna scrol je door naar de volgende sectie.
  // Zonder beweging (reduced motion) of op een heel laag scherm blijft het een gewoon raster.
  (function ring() {
    const sec = $('wat'), pin = sec.querySelector('.ring-pin'), stage = $('ring'), cards = [...stage.querySelectorAll('.card')], n = cards.length;
    if (reduce || !n || innerHeight < 560) return;
    sec.classList.add('ring-on');
    cards.forEach((el) => el.classList.remove('rv'));
    const dotsEl = $('ring-dots');
    dotsEl.innerHTML = cards.map(() => '<i></i>').join('');
    const dots = [...dotsEl.children], STEP = 360 / n;
    let R = 0, top = 0, len = 1, cur = -1, ticking = false;
    function size() {
      const vh = innerHeight;
      sec.style.height = Math.round(vh + (n - 1) * vh * 0.42 + vh * 0.3) + 'px';
      // op een smal scherm een wijdere ring, zodat de blokken ernaast half buiten beeld vallen in plaats van over het voorste heen
      R = clamp(Math.max(stage.clientWidth * 0.36, cards[0].offsetWidth * 0.72), 140, 520);
      top = sec.getBoundingClientRect().top + scrollY;
      len = Math.max(1, sec.offsetHeight - pin.offsetHeight);
      draw();
    }
    // per blok een stukje stilstand, zodat je het voorste blok rustig kunt lezen
    const settle = (t) => { const k = clamp((t - 0.2) / 0.6); return k * k * (3 - 2 * k); };
    function draw() {
      ticking = false;
      const raw = clamp((scrollY - top) / len) * (n - 0.5) - 0.25;
      const r = clamp(raw, 0, n - 1), f = Math.floor(r), p = Math.min(n - 1, f + settle(r - f));
      cards.forEach((el, i) => {
        const d = i - p, a = (d * STEP * Math.PI) / 180;
        const front = (Math.cos(a) + 1) / 2;          // 1 = voor, 0 = achter
        const vis = clamp(4.6 - Math.abs(d));           // verder dan een halve slag weg: nog niet of niet meer in beeld
        // schuin van boven bekeken: wat achter zit staat hoger, en elke slag zakt de spiraal een stukje (de draaikolk)
        const x = Math.sin(a) * R * 1.12, z = (Math.cos(a) - 1) * R * 1.1, y = d * 30 - (1 - front) * R * 0.32;
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${(Math.sin(a) * 38).toFixed(2)}deg) rotateZ(${(d * -3.5).toFixed(2)}deg)`;
        el.style.opacity = (vis * (0.16 + 0.84 * Math.pow(front, 1.6))).toFixed(3);
        el.style.filter = front > 0.995 ? 'none' : `blur(${((1 - front) * 5).toFixed(1)}px)`;
        el.style.zIndex = Math.round(front * 100);
        el.style.pointerEvents = front > 0.9 ? 'auto' : 'none';
      });
      const now = Math.round(p);
      if (now !== cur) {
        cur = now;
        $('ring-n').textContent = String(now + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
        dots.forEach((dt, i) => dt.classList.toggle('on', i === now));
        cards.forEach((el, i) => el.classList.toggle('front', i === now));
      }
    }
    dotsEl.addEventListener('click', (e) => {
      const i = dots.indexOf(e.target); if (i < 0) return;
      scrollTo({ top: top + (len * (i + 0.25)) / (n - 0.5), behavior: 'smooth' });
    });
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    addEventListener('resize', size);
    if (document.fonts) document.fonts.ready.then(size);
    size();
  })();

  /* ---------- branches met dashboard ---------- */
  // Per taak: [taak, uren nu, uren straks]. Indicaties, geen meting.
  // hq = wat er per branche in het Business Operations HQ staat.
  const HQ_TASK = T('Overzicht zoeken: cijfers, planning, lopende zaken', 'Searching for overview: numbers, planning, open items');
  const BR = [
    { id: 'events', tab: T('Activiteiten en events', 'Activities and events'), who: T('Klimhal of groepsuitje', 'Climbing gym or group outing'),
      intro: T('Klimhallen, escape rooms, groepsuitjes en andere zaken waar mensen een tijd boeken. Veel vragen, veel heen en weer, veel bevestigingen.', 'Climbing gyms, escape rooms, group outings and other places where people book a time slot. Lots of questions, lots of back and forth, lots of confirmations.'),
      tasks: [[T('Boekingsvragen via mail en WhatsApp', 'Booking questions via email and WhatsApp'), 5, 1.5], [T('Groepsaanvragen en offertes', 'Group requests and quotes'), 3, 0.5], [T('Bevestigingen en herinneringen', 'Confirmations and reminders'), 2, 0], [T('Wachtlijst en omboekingen', 'Waiting list and rebookings'), 1.5, 0.5], [T('Reviews vragen na een bezoek', 'Asking for reviews after a visit'), 1, 0], [HQ_TASK, 2, 0.25]],
      build: T(['Een assistent die boekingsvragen beantwoordt met jullie eigen info en de echte beschikbaarheid', 'Groepsofferte in één klik vanuit de aanvraag', 'Bevestiging, herinnering en na afloop een reviewvraag, vanzelf', 'Een wachtlijst die zelf het vrijgekomen plekje aanbiedt'],
        ['An assistant that answers booking questions with your own info and real availability', 'A group quote in one click from the request', 'Confirmation, reminder and a review request afterwards, automatically', 'A waiting list that offers a freed-up spot by itself']),
      hq: T('Boekingen, bezetting per dag, het personeelsrooster en de omzet per activiteit.', 'Bookings, occupancy per day, the staff schedule and revenue per activity.'),
      sys: ['Recras of Bookeo', 'Gmail of Outlook', 'WhatsApp Business', 'Google Reviews', 'Mollie'] },
    { id: 'interieur', tab: T('Interieurzaken', 'Interior stores'), who: T('Interieurzaak', 'Interior store'),
      intro: T('Winkels met maatwerk en leveranciers. De tijd zit in offertes, levertijden navragen en klanten op de hoogte houden.', 'Stores with custom work and suppliers. The time goes into quotes, chasing delivery times and keeping customers updated.'),
      tasks: [[T('Offertes op maat', 'Custom quotes'), 4, 1], [T('Levertijden navragen bij leveranciers', 'Chasing delivery times with suppliers'), 2.5, 0.5], [T('Klant op de hoogte houden', 'Keeping the customer updated'), 2, 0.5], [T('Afspraken in de winkel plannen', 'Planning in-store appointments'), 1.5, 0.5], [T('Social posts en nieuwsbrief', 'Social posts and newsletter'), 1.5, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['Offerte met jullie prijzen en productfoto\'s, klaar om te versturen', 'Een checker die leveranciersmails leest en de levertijd bijwerkt', 'Automatische updates naar de klant als er iets verandert', 'Afspraken maken via je site, rechtstreeks in de agenda'],
        ['A quote with your prices and product photos, ready to send', 'A checker that reads supplier emails and updates the delivery time', 'Automatic updates to the customer when something changes', 'Appointments booked via your site, straight into the calendar']),
      hq: T('Lopende orders, leveringen per leverancier, omzet per verkoper en wat er deze week de deur uit gaat.', 'Open orders, deliveries per supplier, revenue per salesperson and what goes out the door this week.'),
      sys: [T('Lightspeed of je kassasysteem', 'Lightspeed or your POS'), 'Outlook', 'Excel', T('Leveranciersportalen', 'Supplier portals'), 'WhatsApp Business'] },
    { id: 'hovenier', tab: T('Hoveniers', 'Landscapers'), who: T('Hoveniersbedrijf', 'Landscaping company'),
      intro: T('Veel buiten, en dan \'s avonds nog offertes, planning en facturen. Daar halen we het meeste weg.', 'Lots of work outside, and then quotes, planning and invoices in the evening. That\'s where we take away the most.'),
      tasks: [[T('Offertes na een bezoek', 'Quotes after a visit'), 4, 1], [T('Planning per ploeg', 'Planning per crew'), 3, 1], [T('Omboeken bij slecht weer', 'Rescheduling in bad weather'), 1.5, 0.25], [T('Uren en facturen verwerken', 'Processing hours and invoices'), 2.5, 0.5], [T('Onderhoudscontracten opvolgen', 'Following up maintenance contracts'), 1, 0.25], [HQ_TASK, 2, 0.25]],
      build: T(['Offerte uit je spraakmemo en de foto\'s van het bezoek', 'Weekplanning per ploeg die bij regen zelf een voorstel doet om te schuiven', 'Uren van de ploeg die vanzelf een factuur worden', 'Herinnering voor onderhoud, op tijd naar de klant'],
        ['A quote from your voice memo and the photos of the visit', 'A weekly plan per crew that suggests changes by itself when it rains', 'Crew hours that turn into an invoice by themselves', 'Maintenance reminders, sent to the customer on time']),
      hq: T('Projecturen per ploeg, lopende projecten, de planning van de week en openstaande facturen.', 'Project hours per crew, running projects, the week\'s planning and outstanding invoices.'),
      sys: [T('Gripp of Excel', 'Gripp or Excel'), T('Moneybird of Exact', 'Moneybird or Exact'), T('Google Agenda', 'Google Calendar'), 'WhatsApp', T('Weerbericht', 'Weather forecast')] },
    { id: 'garage', tab: T('Autogarages', 'Car garages'), who: T('Autogarage', 'Car garage'),
      intro: T('De werkplaats loopt, maar de telefoon en de administratie ook. Afspraken, herinneringen en "uw auto is klaar" kosten meer tijd dan je denkt.', 'The workshop is busy, but so are the phone and the admin. Appointments, reminders and "your car is ready" take more time than you think.'),
      tasks: [[T('Afspraken maken en verzetten', 'Making and moving appointments'), 3, 0.75], [T('APK- en onderhoudsherinneringen', 'MOT and service reminders'), 1.5, 0], [T('Onderdelen opzoeken en bestellen', 'Finding and ordering parts'), 2, 1], [T('Klant bellen dat de auto klaar is', 'Calling the customer that the car is ready'), 1.5, 0.25], [T('Facturen en betalingen', 'Invoices and payments'), 1.5, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['Online afspraken die meteen in je planning landen', 'APK-herinnering via WhatsApp of mail, vanzelf op tijd', '"Je auto is klaar" met factuur en betaallink in één bericht', 'Onderdelenlijst die klaarstaat vanuit de werkorder'],
        ['Online appointments that land straight in your planning', 'MOT reminders via WhatsApp or email, on time by themselves', '"Your car is ready" with invoice and payment link in one message', 'A parts list ready straight from the work order']),
      hq: T('Bezetting van de werkplaats, uren per monteur, auto\'s die klaarstaan en de omzet van de week.', 'Workshop occupancy, hours per mechanic, cars that are ready and the week\'s revenue.'),
      sys: [T('Je garagesoftware', 'Your garage software'), T('RDW-gegevens', 'Vehicle registry data'), 'WhatsApp Business', T('Google Agenda', 'Google Calendar'), 'Mollie'] },
    { id: 'makelaar', tab: T('Makelaars', 'Real estate agents'), who: T('Makelaarskantoor', 'Real estate agency'),
      intro: T('Veel mail, bezichtigingen inplannen en kopers en verkopers op de hoogte houden. En een uur van een makelaar is veel waard.', 'Lots of email, scheduling viewings and keeping buyers and sellers updated. And an hour of an agent is worth a lot.'),
      tasks: [[T('Vragen over woningen beantwoorden', 'Answering questions about properties'), 4, 1], [T('Bezichtigingen plannen', 'Scheduling viewings'), 3, 0.5], [T('Tweede bezichtigingen', 'Second viewings'), 2, 1], [T('Woningvideo en presentatie regelen', 'Arranging property video and presentation'), 2.5, 0.5], [T('Updates naar kopers en verkopers', 'Updates to buyers and sellers'), 2, 0.5], [T('Woningteksten schrijven', 'Writing property descriptions'), 2, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['Een assistent die vragen beantwoordt met de echte woninginfo', 'Bezichtigingen die zelf tijdsloten aanbieden en bevestigen', 'Een 3D-model van elke woning om naar kopers te sturen, zodat ze er al rondlopen voordat ze komen', 'AI-video\'s van je woningen voor je site, Funda en social, voor de beleving van je merk', 'Elke week vanzelf een update naar de verkoper'],
        ['An assistant that answers questions with the real property info', 'Viewings that offer and confirm time slots by themselves', 'A 3D model of every property to send to buyers, so they walk around before they visit', 'AI videos of your properties for your site, listings and social, for your brand experience', 'A weekly update to the seller, automatically']),
      hq: T('Je portefeuille, bezichtigingen per woning, deals in de pijplijn en wat elke makelaar deze week op zijn bord heeft.', 'Your portfolio, viewings per property, deals in the pipeline and what every agent has on their plate this week.'),
      sys: ['Realworks', T('Funda-aanvragen', 'Funda requests'), 'Outlook', T('Google Agenda', 'Google Calendar'), T('Word-sjablonen', 'Word templates')] },
  ];
  let br = 0;
  $('br-tabs').innerHTML = BR.map((b, i) => `<button type="button" role="tab" data-b="${i}" class="${i === br ? 'on' : ''}">${b.tab}</button>`).join('');
  function saved(b) { return b.tasks.reduce((t, x) => t + x[1] - x[2], 0); }
  function info(b) {
    const s = saved(b);
    return `<p class="br-intro">${b.intro}</p>
      <div class="br-table"><div class="br-row h"><span>${T('Waar de tijd nu heen gaat', 'Where the time goes now')}</span><span>${T('Nu', 'Now')}</span><span>${T('Straks', 'After')}</span></div>
      ${b.tasks.map(([t, a, z]) => `<div class="br-row"><span>${t}</span><span>${uur(a)}</span><span class="z">${uur(z)}</span></div>`).join('')}
      <div class="br-row t"><span>${T('Terug per week', 'Back per week')}</span><span></span><span>${uur(s)}</span></div></div>
      <p class="br-k">${T('Wat we bouwen', 'What we build')}</p><ul class="br-build">${b.build.map((x) => `<li>${x}</li>`).join('')}</ul>
      <div class="br-hq"><span class="br-hq-ico" aria-hidden="true"><i></i><i></i><i></i><i></i></span><div><b>${T('Inclusief je Business Operations HQ', 'Including your Business Operations HQ')}</b>
        <p>${T('Al je bedrijfsdata in één overzicht', 'All your business data in one overview')}: ${b.hq.charAt(0).toLowerCase() + b.hq.slice(1)} ${T('Geen gezoek meer in vijf programma\'s, en veel meer ruimte in je hoofd.', 'No more searching through five programs, and a lot more room in your head.')}</p></div></div>
      <p class="br-k">${T('Werkt met', 'Works with')}</p><div class="br-sys">${b.sys.map((x) => `<span>${x}</span>`).join('')}</div>`;
  }
  function dash(b) {
    const s = saved(b), goal = Math.round(s), wk = [0, 0, Math.round(s * 0.35 * 2) / 2, Math.round(s * 0.6 * 2) / 2, Math.round(s * 0.8 * 2) / 2, s * 0.9, s, s * 1.02, s * 0.97, s];
    const total = wk.reduce((t, v) => t + v, 0), max = Math.max(goal + 3, ...wk), U = T('uur', 'hrs');
    return `<div class="kd-head"><b>${T('KPI-dashboard', 'KPI dashboard')} · ${b.who}</b><span>${T('Voorbeeld', 'Example')}</span></div>
      <div class="kd-tiles">
        <div class="kd-tile hl"><small>${T('Deze week', 'This week')}</small><b>${nl(s, s % 1 ? 1 : 0)}<i>${U}</i></b></div>
        <div class="kd-tile"><small>${T('Doel', 'Goal')}</small><b>${goal}<i>${U}</i></b></div>
        <div class="kd-tile"><small>${T('Totaal', 'Total')}</small><b>${nl(total)}<i>${U}</i></b></div>
        <div class="kd-tile"><small>${T('Waarde per jaar', 'Value per year')}</small><b>${eur(s * WEEKS * RATE)}</b></div>
      </div>
      <div class="kd-chart"><div class="goal" style="bottom:${(goal / max) * 100}%"><span>${T('DOEL', 'GOAL')} ${goal} ${T('U', 'H')}</span></div><div class="goal g5" style="bottom:${(5 / max) * 100}%"><span>${T('GARANTIE 5 U', 'GUARANTEE 5 H')}</span></div>
        ${wk.map((v, i) => `<i style="--h:${(v / max) * 100}%;--d:${i * 50}ms" title="${uur(Math.round(v * 10) / 10)}"></i>`).join('')}</div>
      <div class="kd-x">${wk.map((_, i) => `<span>${i < 2 ? T('Nul', 'Base') : T('W', 'W') + (i - 1)}</span>`).join('')}</div>
      <div class="kd-list">${b.tasks.slice(0, 3).map(([t, a, z]) => `<div><span>${t}</span><b>${uur(a - z)} ${T('terug', 'back')}</b></div>`).join('')}</div>`;
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
    l.append(IBELoader.make('zoeken', 40), T('Dashboard laden', 'Loading dashboard'));
    d.replaceChildren(l);
    setTimeout(() => { d.innerHTML = dash(b); d.style.minHeight = ''; requestAnimationFrame(() => d.classList.add('grow')); }, 420);
  }
  $('br-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showBranch(+b.dataset.b); });
  showBranch(0, true);

  /* ---------- prijsopbouw: trede voor trede, gevormd door dots ---------- */
  // De prijzen staan gewoon als tekst in de HTML (voor zoekmachines en schermlezers). Met beweging aan wordt die tekst
  // onzichtbaar en vormen rode dots hem na: ze vallen van boven naar binnen terwijl je naar beneden scrolt.
  (function tiers() {
    const box = $('tiers'); if (!box) return;
    const H10 = 10, R50 = 50, perMonth = (H10 * R50 * WEEKS) / 12;
    $('ti-month').textContent = eur(perMonth);
    $('ti-year').textContent = T(`Dat is ${eur(H10 * R50 * WEEKS)} per jaar. Je verdient het traject dus snel terug.`, `That is ${eur(H10 * R50 * WEEKS)} a year. So you earn the project back quickly.`);
    box.querySelectorAll('[data-pay]').forEach((el) => { el.textContent = weken(Math.ceil(+el.dataset.pay / (H10 * R50))); });
    const sp = c.prijsPlekken || { bezet: 2, totaal: 4 }, vrij = Math.max(0, sp.totaal - sp.bezet);
    $('t-spots').innerHTML = `<span class="sq">${Array.from({ length: sp.totaal }, (_, i) => `<i class="${i < sp.bezet ? 'on' : ''}"></i>`).join('')}</span>
      <span>${T(`${sp.bezet} van de ${sp.totaal} plekken vergeven · <b>nog ${vrij} ${vrij === 1 ? 'plek' : 'plekken'} voor deze prijs</b>`, `${sp.bezet} of ${sp.totaal} spots taken · <b>${vrij} ${vrij === 1 ? 'spot' : 'spots'} left at this price</b>`)}</span>`;

    const rows = [...box.querySelectorAll('.tier')], fill = box.querySelector('.tiers-rail i');
    const rowProg = (r) => clamp((innerHeight * 0.9 - r.top) / (innerHeight * 0.42));
    function rail() {
      const b = box.getBoundingClientRect();
      fill.style.height = clamp((innerHeight * 0.62 - b.top) / b.height) * 100 + '%';
      rows.forEach((row) => row.classList.toggle('lit', rowProg(row.getBoundingClientRect()) > 0.85));
    }
    addEventListener('scroll', rail, { passive: true }); rail();
    if (reduce) return;

    const cv = box.querySelector('.tiers-cv'), ctx = cv.getContext('2d');
    box.classList.add('dots-on');
    let W = 0, H = 0, dpr = 1, pts = [], on = false, ready = false;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    function build() {
      dpr = Math.min(2, devicePixelRatio || 1); W = box.clientWidth; H = box.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      const b = box.getBoundingClientRect(); pts = [];
      rows.forEach((row, ri) => {
        const el = row.querySelector('.t-amt'), r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        const fs = parseFloat(cs.fontSize), gap = Math.max(3, fs / 17), w = Math.ceil(r.width) + 6, h = Math.ceil(r.height) + 6;
        const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
        const o = oc.getContext('2d');
        o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; o.textBaseline = 'middle'; o.fillStyle = '#000';
        o.fillText(el.textContent.trim(), 0, h / 2);
        const px = o.getImageData(0, 0, w, h).data, ox = r.left - b.left, oy = r.top - b.top - 3;
        for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) {
          if (px[((y | 0) * w + (x | 0)) * 4 + 3] < 120) continue;
          const tx = ox + x, ty = oy + y;
          pts.push({ tx, ty, sx: Math.random() * W, sy: ty - 60 - Math.random() * 260, d: Math.random() * 0.35 + (x / w) * 0.12, s: Math.random() * 6.283, r: gap * 0.34, row: ri });
        }
      });
      ready = true;
    }
    const RED = '210,64,76', LIGHT = '255,110,118';
    function draw(now) {
      if (!on) return;
      requestAnimationFrame(draw);
      if (!ready) return;
      const t = now / 1000, prog = rows.map((row) => rowProg(row.getBoundingClientRect()));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      // per kleur en doorzichtigheid één pad, dat scheelt rekenwerk
      const paths = {};
      for (const p of pts) {
        const pr = prog[p.row]; if (pr <= 0) continue;
        const k = clamp((pr - p.d) / 0.6), e = ease(k), free = 1 - e;
        const x = p.sx + (p.tx - p.sx) * e + Math.sin(t * 1.2 + p.s) * free * 22;
        const y = p.sy + (p.ty - p.sy) * e + Math.cos(t * 0.9 + p.s) * free * 12 + (e === 1 ? Math.sin(t * 2.2 + p.tx * 0.05) * 0.6 : 0);
        const a = Math.round((0.12 + 0.88 * e) * Math.min(1, pr * 3) * 8) / 8;
        const key = (rows[p.row].classList.contains('ent') ? LIGHT : RED) + '|' + a;
        (paths[key] || (paths[key] = [])).push(x, y, p.r * (0.7 + 0.3 * e));
      }
      for (const key in paths) {
        const [col, a] = key.split('|'), L = paths[key];
        ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath();
        for (let i = 0; i < L.length; i += 3) { ctx.moveTo(L[i] + L[i + 2], L[i + 1]); ctx.arc(L[i], L[i + 1], L[i + 2], 0, 6.283); }
        ctx.fill();
      }
    }
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { const was = on; on = en[0].isIntersecting; if (on && !was) requestAnimationFrame(draw); }, { rootMargin: '120px' }).observe(box);
    else { on = true; requestAnimationFrame(draw); }
    let rt = 0;
    const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 120); };
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(box); else addEventListener('resize', rebuild);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
  })();

  /* ---------- VSL ---------- */
  $('vsl-len').textContent = 'Video · ' + (c.vslLength || '3 min');
  if (c.vsl) $('vsl-sub').textContent = T('Klik om af te spelen', 'Click to play');
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
    if (window.IBELoader) IBELoader.busy(b, T('Agenda openen', 'Opening calendar'), 'luisteren', 1600);
  }));

  // pas na de ring: die haalt de inschuif-animatie van zijn eigen blokken af
  document.querySelectorAll('.rv').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
})();

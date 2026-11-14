// Gedrag van de AI-pagina: morph, overgangen, je week voor en na, ring met wat we overnemen,
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
  const WEEKS = 46, RATE = 60, PRICE = 1500; // RATE: gemiddeld uurtarief, zelfde als de schuif in de header

  if (window.IBEDots) {
    IBEDots($('hero-dots'), { theme: 'light', gap: 22 });
    if (!c.vslPoster) IBEDots($('vsl-dots'), { theme: 'dark', lion: { x: 0.5, y: 0.5, size: 0.86 } }); // met een video staat daar het stilstaande beeld
  }
  // AI-site: zandloper (tijd) en een netwerk van tools
  if (window.IBEMorph) IBEMorph($('hero-morph'), { theme: 'light', shapes: ['leeuw', 'zandloper', 'kubus-persoon', 'puzzel', 'netwerk'] }); // zonder woorden eronder: rustiger
  if (window.IBEDither) document.querySelectorAll('canvas.fx-dither').forEach((cv) => IBEDither(cv, { top: cv.dataset.top, bottom: cv.dataset.bottom, mode: cv.dataset.mode }));
  if (window.IBEFx) {
    IBEFx.words('.hero h1, .head h2');
    IBEFx.highlight('.hl', 'marker'); // witte site: halftone-marker achter de belangrijke woorden
    IBEFx.count('.guarantee .seal b');
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 }) : null;

  // header: wat 5 tot 15 uur per week waard is per week
  // standaard 10 uur (het gemiddelde); het uurloon kun je zelf invullen
  $('w-r').value = 10;
  const worth = () => { const h = +$('w-r').value, rate = Math.max(0, parseFloat($('w-rate').value) || 0); $('w-h').textContent = uur(h); $('w-v').textContent = eur(h * rate); };
  $('w-r').addEventListener('input', worth); $('w-rate').addEventListener('input', worth); worth();

  /* ---------- reviews: vaste kaartjes, vanaf 6 reviews drie rijen die langzaam langsschuiven ---------- */
  // Reviews komen uit js/config.js (reviews: [{ naam, bedrijf, tekst, sterren }]). Zonder reviews staat er alleen het Google-logo.
  // Elke schuivende rij is twee keer dezelfde reeks, zodat hij naadloos door kan lopen (CSS-animatie).
  (function reviews() {
    const box = $('reviews'); if (!box) return;
    const list = (c.reviews || []).filter((r) => r.tekst);
    // Weinig reviews: het Google-logo in het midden met de kaartjes er vast onder. Langsschuivende rijen pas vanaf 6 reviews.
    const esc = (x) => String(x).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
    const card = (r) => `<article class="rv-card${r.voorbeeld ? ' ex' : ''}"><div class="rv-top"><span class="rv-stars" aria-label="${r.sterren || 5} ${T('sterren', 'stars')}">${'★'.repeat(r.sterren || 5)}</span></div><p class="rv-text">“${esc(r.tekst)}”</p><button type="button" class="rv-more" hidden aria-expanded="false">${T('Lees meer', 'Read more')}</button><footer><b>${esc(r.naam)}</b><span>${esc(r.bedrijf || '')}</span>${r.voorbeeld ? `<i>${T('Voorbeeld', 'Example')}</i>` : ''}</footer></article>`;
    if (list.length < 6) {
      box.classList.add('empty');
      box.innerHTML = `<div class="rv-logo"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><b>Google Reviews</b><span class="rv-stars" aria-hidden="true">★★★★★</span></div>${list.length ? `<div class="rv-static">${list.map(card).join('')}</div>` : ''}`;
      // Lange reviews staan ingeklapt op 3 regels; de knop verschijnt alleen als er echt tekst is afgekapt
      const meet = () => box.querySelectorAll('.rv-card:not(.open)').forEach((k) => { const p = k.querySelector('.rv-text'); k.querySelector('.rv-more').hidden = p.scrollHeight <= p.clientHeight + 1; });
      box.addEventListener('click', (e) => {
        const b = e.target.closest('.rv-more'); if (!b) return;
        const open = b.closest('.rv-card').classList.toggle('open');
        b.textContent = open ? T('Lees minder', 'Read less') : T('Lees meer', 'Read more');
        b.setAttribute('aria-expanded', open);
      });
      meet(); addEventListener('resize', meet); if (document.fonts) document.fonts.ready.then(meet);
      return;
    }
    const per = Math.ceil(list.length / 3);
    box.innerHTML = [0, 1, 2].map((row) => {
      const items = list.slice(row * per, row * per + per);
      const seq = items.map(card).join('');
      return `<div class="rv-row${row === 1 ? ' rev' : ''}" style="--n:${items.length}"><div class="rv-track">${seq}${seq}</div></div>`;
    }).join('');
  })();

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
  // hq = wat er in het Business Operations HQ staat,
  // build = welk systeem we bouwen en welk probleem dat oplost.
  // De belangrijkste koppelingen voor bedrijven, voor elke branche hetzelfde (er kan veel meer)
  const CONNECT = ['Gmail', 'Outlook', T('Google Agenda', 'Google Calendar'), 'WhatsApp Business', 'Microsoft Teams', 'Slack', 'Google Drive', 'Excel', 'Exact', 'Moneybird', 'HubSpot', 'Shopify', 'Mollie'];
  const HQ_TASK = T('Overzicht zoeken: cijfers, planning, lopende zaken', 'Searching for overview: numbers, planning, open items');
  // Voor elke branche hetzelfde: video's maken en plaatsen kost elke week uren, daar bouwen we een systeem voor.
  const CONTENT_BUILD = T('We bouwen een <b>content creatie- en distributiesysteem</b>. Dat lost op dat video\'s maken en plaatsen elke week uren kost.',
    'We build a <b>content creation and distribution system</b>. That solves making and posting videos eating up hours every week.');
  const BR = [
    // Dit is wat op de site staat: een gewone week op kantoor, zonder vaste niche. De branches eronder staan nog in de code
    // (tabs zijn op 3 nov weggehaald) voor als Bob later wel een niche kiest: dan de tabs in index.html en hieronder weer aanzetten.
    { id: 'algemeen', tab: T('Jouw zaak', 'Your business'), who: T('Jouw bedrijf', 'Your business'),
      intro: T('Herken je dit? Een gewone week op kantoor, bij een team van een paar mensen. Alles wat rood wordt in je agenda, komt hier terug.', 'Recognise this? A normal week in the office, with a team of a few people. Everything that turns red in your calendar comes back here.'),
      tasks: [[T('Mail en klantvragen', 'Email and customer questions'), 3.5, 1], [T('Planning en afspraken', 'Planning and appointments'), 3, 0.75], [T('Offertes en aanvragen', 'Quotes and requests'), 3, 0.5], [T('Content maken en plaatsen', 'Making and posting content'), 3, 0.5], [T('Administratie en facturen', 'Admin and invoices'), 2.5, 0.5], [T('Maatwerk: een eigen tool of klantportaal', 'Custom work: your own tool or client portal'), 2, 0.75], [T('Overtypen tussen systemen', 'Retyping between systems'), 1.5, 0.5], [HQ_TASK, 1.5, 0.5]],
      build: T(['We bouwen een <b>planningssysteem</b>. Dat lost het heen en weer over afspraken, roosters en leveringen op.', 'We bouwen een <b>content creatie- en distributiesysteem</b>. Dat lost op dat video\'s maken en plaatsen elke week uren kost.', 'We bouwen een <b>administratiesysteem</b>. Dat lost losse bonnetjes, late facturen en overtypen op.', 'We bouwen een <b>mail- en offertesysteem</b>. Dat lost op dat vragen blijven liggen en elke offerte handwerk is.', 'We bouwen <b>maatwerk</b> en <b>DFY-systemen</b>.'],
        ['We build a <b>planning system</b>. That solves the back and forth about appointments, schedules and deliveries.', 'We build a <b>content creation and distribution system</b>. That solves making and posting videos eating up hours every week.', 'We build an <b>admin system</b>. That solves loose receipts, late invoices and retyping.', 'We build an <b>email and quoting system</b>. That solves questions being left unanswered and every quote being manual work.', 'We build <b>custom work</b> and <b>DFY systems</b>.']),
      hq: T('Omzet, openstaande facturen, de planning van de week, lopende projecten en uren per persoon.', 'Revenue, outstanding invoices, the week\'s planning, running projects and hours per person.'), },
    { id: 'events', tab: T('Activiteiten en events', 'Activities and events'), who: T('Klimhal of groepsuitje', 'Climbing gym or group outing'),
      intro: T('Klimhallen, escape rooms, groepsuitjes en andere zaken waar mensen een tijd boeken. Veel vragen, veel heen en weer, veel bevestigingen.', 'Climbing gyms, escape rooms, group outings and other places where people book a time slot. Lots of questions, lots of back and forth, lots of confirmations.'),
      tasks: [[T('Boekingsvragen via mail en WhatsApp', 'Booking questions via email and WhatsApp'), 5, 1], [T('Groepsaanvragen en offertes', 'Group requests and quotes'), 3, 0.5], [T('Bevestigingen, herinneringen en reviews', 'Confirmations, reminders and reviews'), 2.5, 0], [T('Personeelsrooster rond drukke dagen', 'Staff schedule around busy days'), 2, 0.5], [T('Social: video\'s maken en plaatsen', 'Social: making and posting videos'), 3, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['We bouwen een <b>boekingssysteem</b>. Dat lost het heen en weer over beschikbaarheid, bevestigingen en herinneringen op.', 'We bouwen een <b>offertesysteem</b>. Dat lost op dat groepsaanvragen dagen blijven liggen.', 'We bouwen een <b>planningssysteem</b>. Dat lost op dat je rooster niet past bij de drukte.'],
        ['We build a <b>booking system</b>. That solves the back and forth about availability, confirmations and reminders.', 'We build a <b>quoting system</b>. That solves group requests sitting around for days.', 'We build a <b>planning system</b>. That solves a staff schedule that doesn\'t match how busy you are.']),
      hq: T('Boekingen, bezetting per dag, het personeelsrooster en de omzet per activiteit.', 'Bookings, occupancy per day, the staff schedule and revenue per activity.'), },
    { id: 'interieur', tab: T('Interieurzaken', 'Interior stores'), who: T('Interieurzaak', 'Interior store'),
      intro: T('Winkels met maatwerk en leveranciers. De tijd zit in offertes, levertijden navragen, klanten op de hoogte houden en je collectie laten zien.', 'Stores with custom work and suppliers. The time goes into quotes, chasing delivery times, keeping customers updated and showing your collection.'),
      tasks: [[T('Offertes op maat', 'Custom quotes'), 4, 1], [T('Levertijden navragen bij leveranciers', 'Chasing delivery times with suppliers'), 2.5, 0.5], [T('Klant op de hoogte houden', 'Keeping the customer updated'), 2, 0.25], [T('Productinfo en voorraad bijwerken', 'Updating product info and stock'), 2, 0.5], [T('Collectie op social: video\'s maken en plaatsen', 'Collection on social: making and posting videos'), 3, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['We bouwen een <b>offertesysteem</b>. Dat lost op dat een offerte op maat je uren kost.', 'We bouwen een <b>order- en leveringssysteem</b>. Dat lost het navragen bij leveranciers en het bijpraten van klanten op.', 'We bouwen een <b>productsysteem</b>. Dat lost het dubbele werk in je webshop en kassa op.'],
        ['We build a <b>quoting system</b>. That solves custom quotes costing you hours.', 'We build an <b>order and delivery system</b>. That solves chasing suppliers and updating customers.', 'We build a <b>product system</b>. That solves the double work in your webshop and POS.']),
      hq: T('Lopende orders, leveringen per leverancier, omzet per verkoper en wat er deze week de deur uit gaat.', 'Open orders, deliveries per supplier, revenue per salesperson and what goes out the door this week.'), },
    { id: 'hovenier', tab: T('Hoveniers', 'Landscapers'), who: T('Hoveniersbedrijf', 'Landscaping company'),
      intro: T('Veel buiten, en dan \'s avonds nog offertes, planning en facturen. Daar halen we het meeste weg.', 'Lots of work outside, and then quotes, planning and invoices in the evening. That\'s where we take away the most.'),
      tasks: [[T('Offertes na een bezoek', 'Quotes after a visit'), 4, 1], [T('Planning per ploeg en omboeken bij regen', 'Planning per crew and rescheduling in rain'), 4, 1], [T('Uren en facturen verwerken', 'Processing hours and invoices'), 2.5, 0.5], [T('Materiaal bestellen bij leveranciers', 'Ordering materials from suppliers'), 1.5, 0.5], [T('Voor en na: projecten op social zetten', 'Before and after: projects on social'), 2, 0.25], [HQ_TASK, 2, 0.25]],
      build: T(['We bouwen een <b>offertesysteem</b>. Dat lost de avonden achter de laptop na een bezoek op.', 'We bouwen een <b>planningssysteem</b>. Dat lost het puzzelen met ploegen en het weer op.', 'We bouwen een <b>administratiesysteem</b>. Dat lost losse urenbriefjes en late facturen op.'],
        ['We build a <b>quoting system</b>. That solves the evenings behind the laptop after a visit.', 'We build a <b>planning system</b>. That solves juggling crews and the weather.', 'We build an <b>admin system</b>. That solves loose timesheets and late invoices.']),
      hq: T('Projecturen per ploeg, lopende projecten, de planning van de week en openstaande facturen.', 'Project hours per crew, running projects, the week\'s planning and outstanding invoices.'), },
    { id: 'garage', tab: T('Autogarages', 'Car garages'), who: T('Autogarage', 'Car garage'),
      intro: T('De werkplaats loopt, maar de telefoon en de administratie ook. Afspraken, herinneringen, occasions online zetten en "uw auto is klaar" kosten meer tijd dan je denkt.', 'The workshop is busy, but so are the phone and the admin. Appointments, reminders, listing used cars and "your car is ready" take more time than you think.'),
      tasks: [[T('Telefoon: afspraken maken en verzetten', 'Phone: making and moving appointments'), 3.5, 0.75], [T('APK- en onderhoudsherinneringen', 'MOT and service reminders'), 1.5, 0], [T('Onderdelen opzoeken en bestellen', 'Finding and ordering parts'), 2, 1], [T('Klant bijpraten: status, foto\'s, "auto is klaar"', 'Updating customers: status, photos, "car is ready"'), 2, 0.25], [T('Occasions en social: video\'s maken en plaatsen', 'Used cars and social: making and posting videos'), 2.5, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['We bouwen een <b>afsprakensysteem</b>. Dat lost de telefoon op die de hele dag gaat.', 'We bouwen een <b>klantcommunicatiesysteem</b>. Dat lost het nabellen en herinneren op.', 'We bouwen een <b>occasionsysteem</b>. Dat lost op dat elke advertentie uren werk is.'],
        ['We build an <b>appointment system</b>. That solves the phone ringing all day.', 'We build a <b>customer communication system</b>. That solves calling back and reminding.', 'We build a <b>used-car system</b>. That solves every listing taking hours.']),
      hq: T('Bezetting van de werkplaats, uren per monteur, auto\'s die klaarstaan en de omzet van de week.', 'Workshop occupancy, hours per mechanic, cars that are ready and the week\'s revenue.'), },
    { id: 'makelaar', tab: T('Makelaars', 'Real estate agents'), who: T('Makelaarskantoor', 'Real estate agency'),
      intro: T('Veel mail, bezichtigingen inplannen en kopers en verkopers op de hoogte houden. En een uur van een makelaar is veel waard.', 'Lots of email, scheduling viewings and keeping buyers and sellers updated. And an hour of an agent is worth a lot.'),
      tasks: [[T('Vragen over woningen beantwoorden', 'Answering questions about properties'), 4, 1], [T('Bezichtigingen plannen', 'Scheduling viewings'), 3, 0.5], [T('Tweede bezichtigingen', 'Second viewings'), 2, 1], [T('Woningvideo\'s maken en op social zetten', 'Making property videos and posting them'), 3, 0.5], [T('Updates naar kopers en verkopers', 'Updates to buyers and sellers'), 2, 0.5], [T('Woningteksten schrijven', 'Writing property descriptions'), 2, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['We bouwen een <b>bezichtigingssysteem</b>. Dat lost het heen en weer plannen op.', 'We bouwen een <b>presentatiesysteem</b> met 3D-modellen en AI-video. Dat lost op dat elke woning een fotograaf en een filmer nodig heeft.', 'We bouwen een <b>communicatiesysteem</b>. Dat lost op dat kopers en verkopers steeds bellen voor een update.'],
        ['We build a <b>viewing system</b>. That solves scheduling back and forth.', 'We build a <b>presentation system</b> with 3D models and AI video. That solves every property needing a photographer and a filmmaker.', 'We build a <b>communication system</b>. That solves buyers and sellers calling for updates.']),
      hq: T('Je portefeuille, bezichtigingen per woning, deals in de pijplijn en wat elke makelaar deze week op zijn bord heeft.', 'Your portfolio, viewings per property, deals in the pipeline and what every agent has on their plate this week.'), },
    { id: 'textiel', tab: T('Textiel en kleding', 'Textiles and clothing'), who: T('Textielbedrijf', 'Textile company'),
      intro: T('Bedrukkers, kledingmerken en textielateliers. Veel aanvragen op maat, samples, maten en aantallen, productieplanning en een webshop die bijgehouden moet worden.', 'Printers, clothing brands and textile studios. Lots of custom requests, samples, sizes and quantities, production planning and a webshop that needs updating.'),
      tasks: [[T('Aanvragen en offertes (aantallen, maten, techniek)', 'Requests and quotes (quantities, sizes, technique)'), 4, 1], [T('Proefdrukken en samples heen en weer', 'Proofs and samples back and forth'), 2.5, 0.75], [T('Productieplanning en orderstatus doorgeven', 'Production planning and order status updates'), 3, 0.75], [T('Voorraad en inkoop van blanks', 'Stock and purchasing of blanks'), 2, 0.5], [T('Webshop: nieuwe producten en foto\'s', 'Webshop: new products and photos'), 2, 0.5], [T('Social: productvideo\'s maken en plaatsen', 'Social: making and posting product videos'), 3, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['We bouwen een <b>offertesysteem</b>. Dat lost op dat elke aanvraag met maten en aantallen handwerk is.', 'We bouwen een <b>order- en productiesysteem</b>. Dat lost het najagen van proefdrukken en orderstatus op.', 'We bouwen een <b>voorraadsysteem</b>. Dat lost tekorten aan blanks op het laatste moment op.'],
        ['We build a <b>quoting system</b>. That solves every request with sizes and quantities being manual work.', 'We build an <b>order and production system</b>. That solves chasing proofs and order status.', 'We build a <b>stock system</b>. That solves running out of blanks at the last minute.']),
      hq: T('Orders per fase, productiecapaciteit van de week, voorraad, omzet per kanaal en wat er vandaag verzonden moet worden.', 'Orders per stage, production capacity for the week, stock, revenue per channel and what needs to ship today.'), },
    { id: 'bureau', tab: T('Marketingbureaus', 'Marketing agencies'), who: T('Marketingbureau', 'Marketing agency'),
      intro: T('Bureaus voor social, content, ads of websites. De tijd zit in rapportages, briefings, goedkeuringen en klanten bijpraten, terwijl het echte werk eigenlijk moet gebeuren.', 'Agencies for social, content, ads or websites. The time goes into reports, briefings, approvals and updating clients, while the real work still has to get done.'),
      tasks: [[T('Maandrapportages per klant: cijfers bij elkaar zoeken', 'Monthly reports per client: gathering the numbers'), 4, 0.5], [T('Briefings en offertes uitschrijven', 'Writing briefings and quotes'), 4, 1], [T('Goedkeuringen en feedback heen en weer', 'Approvals and feedback back and forth'), 3, 0.75], [T('Klantmail en statusvragen', 'Client email and status questions'), 4, 1], [T('Uren schrijven en facturen maken', 'Logging hours and making invoices'), 2.5, 0.5], [T('Eigen social: video\'s maken en plaatsen', 'Own social: making and posting videos'), 3, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['We bouwen een <b>rapportagesysteem</b>. Dat lost op dat elke maand de cijfers van alle klanten bij elkaar gezocht worden.', 'We bouwen een <b>briefing- en offertesysteem</b>. Dat lost op dat elke aanvraag weer helemaal opnieuw uitgeschreven wordt.', 'We bouwen een <b>klantportaal</b>. Dat lost het heen en weer mailen over goedkeuringen en status op.'],
        ['We build a <b>reporting system</b>. That solves gathering every client\'s numbers by hand each month.', 'We build a <b>briefing and quoting system</b>. That solves writing every request out from scratch.', 'We build a <b>client portal</b>. That solves the back and forth about approvals and status.']),
      hq: T('Omzet en marge per klant, uren per project, lopende campagnes, de deadlines van deze week en openstaande facturen.', 'Revenue and margin per client, hours per project, running campaigns, this week\'s deadlines and outstanding invoices.'), },
    { id: 'content', tab: T('Contentbureaus', 'Content agencies'), who: T('Contentbureau', 'Content agency'),
      intro: T('Bureaus die video\'s, foto\'s en content maken voor klanten. De tijd zit niet in het maken, maar eromheen: shoots plannen, feedbackrondes, bestanden versturen en kalenders bijhouden.', 'Agencies that make videos, photos and content for clients. The time is not in the making, but around it: planning shoots, feedback rounds, sending files and keeping calendars.'),
      tasks: [[T('Shoots en opnames plannen met klant en crew', 'Planning shoots with client and crew'), 3, 0.75], [T('Feedbackrondes en goedkeuringen per video', 'Feedback rounds and approvals per video'), 3.5, 0.75], [T('Bestanden klaarzetten en versturen per kanaal', 'Preparing and sending files per channel'), 3, 0.5], [T('Briefings en offertes uitschrijven', 'Writing briefings and quotes'), 3, 0.75], [T('Contentkalenders bijhouden per klant', 'Keeping content calendars per client'), 3, 0.5], [T('Uren schrijven en facturen maken', 'Logging hours and making invoices'), 2, 0.5], [HQ_TASK, 2, 0.25]],
      build: T(['We bouwen een <b>productieplanningssysteem</b>. Dat lost het heen en weer over data, locaties en crew op.', 'We bouwen een <b>goedkeuringsportaal</b>. Dat lost op dat feedback over vijf mails en appjes verspreid staat.', 'We bouwen een <b>uren- en factuursysteem</b>. Dat lost op dat facturen te laat de deur uit gaan.'],
        ['We build a <b>production planning system</b>. That solves the back and forth about dates, locations and crew.', 'We build an <b>approval portal</b>. That solves feedback being spread over five emails and messages.', 'We build an <b>hours and invoicing system</b>. That solves invoices going out late.']),
      hq: T('Projecten per fase, shoots van deze week, video\'s die wachten op goedkeuring, uren per klant en de omzet per maand.', 'Projects per stage, this week\'s shoots, videos waiting for approval, hours per client and revenue per month.'), },
  ];
  let br = 0;
  if ($('br-tabs')) $('br-tabs').innerHTML = BR.map((b, i) => `<button type="button" role="tab" data-b="${i}" class="${i === br ? 'on' : ''}">${b.tab}</button>`).join('');
  function saved(b) { return b.tasks.reduce((t, x) => t + x[1] - x[2], 0); }
  function info(b) {
    const s = saved(b);
    return `<p class="br-intro">${b.intro}</p>
      <div class="br-table"><div class="br-row h"><span>${T('Waar de tijd nu heen gaat', 'Where the time goes now')}</span><span>${T('Nu', 'Now')}</span><span>${T('Straks', 'After')}</span></div>
      ${b.tasks.map(([t, a, z]) => `<div class="br-row"><span>${t}</span><span>${uur(a)}</span><span class="z">${uur(z)}</span></div>`).join('')}
      <div class="br-row t"><span>${T('Terug per week', 'Back per week')}</span><span></span><span>${uur(s)}</span></div></div>
      <p class="br-k">${T('Wat we bouwen', 'What we build')}</p><ul class="br-build">${(b.id === 'algemeen' ? b.build : [...b.build, CONTENT_BUILD]).map((x) => `<li><span>${x}</span></li>`).join('')}</ul>
      <div class="br-hq"><span class="br-hq-ico" aria-hidden="true"><i></i><i></i><i></i><i></i></span><div><b>${T('Inclusief je Business Operations HQ', 'Including your Business Operations HQ')}</b>
        <p>${T('Al je bedrijfsdata in één overzicht', 'All your business data in one overview')}: ${b.hq.charAt(0).toLowerCase() + b.hq.slice(1)} ${T('Geen gezoek meer in vijf programma\'s, en veel meer ruimte in je hoofd.', 'No more searching through five programs, and a lot more room in your head.')}</p></div></div>
      <p class="br-k">${T('Koppelt met', 'Connects with')}</p><div class="br-sys">${CONNECT.map((x) => `<span>${x}</span>`).join('')}<span class="more">${T('en nog veel meer', 'and many more')}</span></div>`;
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
      <div class="kd-chart"><div class="goal" style="bottom:${(goal / max) * 100}%"><span>${T('DOEL', 'GOAL')} ${goal} ${T('U', 'H')}</span></div><div class="goal g5" style="bottom:${(10 / max) * 100}%"><span>${T('GARANTIE 10 U', 'GUARANTEE 10 H')}</span></div>
        ${wk.map((v, i) => `<i style="--h:${(v / max) * 100}%;--d:${i * 50}ms" title="${uur(Math.round(v * 10) / 10)}"></i>`).join('')}</div>
      <div class="kd-x">${wk.map((_, i) => `<span>${i < 2 ? T('Nul', 'Base') : T('W', 'W') + (i - 1)}</span>`).join('')}</div>
      <div class="kd-list">${b.tasks.slice(0, 3).map(([t, a, z]) => `<div><span>${t}</span><b>${uur(a - z)} ${T('terug', 'back')}</b></div>`).join('')}</div>`;
  }
  function showBranch(i, quick) {
    br = i; const b = BR[i];
    if ($('br-tabs')) $('br-tabs').querySelectorAll('button').forEach((x, k) => x.classList.toggle('on', k === i));
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
  if ($('br-tabs')) $('br-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showBranch(+b.dataset.b); });
  if ($('br-body')) showBranch(0, true);

  /* ---------- tijdlijn: van nulmeting tot resultaat, stap voor stap gevormd door dots ---------- */
  // De tijd per stap (Week 0, Week 2, ...) staat gewoon als tekst in de HTML (voor zoekmachines en schermlezers). Met beweging
  // aan wordt die tekst onzichtbaar en vormen rode dots hem na: ze vallen van boven naar binnen terwijl je naar beneden scrolt.
  (function tiers() {
    const box = $('tiers'); if (!box) return;
    const rows = [...box.querySelectorAll('.tier')], railEl = box.querySelector('.tiers-rail'), fill = railEl.querySelector('i');
    const rowProg = (r) => clamp((innerHeight * 0.9 - r.top) / (innerHeight * 0.42));
    // de lijn loopt precies van het midden van het eerste bolletje naar het midden van het laatste
    const nodes = rows.map((row) => row.querySelector('.t-node'));
    function placeRail() {
      const b = box.getBoundingClientRect(), mid = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top]; };
      const [x, y0] = mid(nodes[0]), [, y1] = mid(nodes[nodes.length - 1]);
      Object.assign(railEl.style, { left: x - 1 + 'px', top: y0 + 'px', height: y1 - y0 + 'px', bottom: 'auto' });
    }
    if ('ResizeObserver' in window) new ResizeObserver(placeRail).observe(box); else addEventListener('resize', placeRail);
    placeRail();
    function rail() {
      const r = railEl.getBoundingClientRect();
      fill.style.height = clamp((innerHeight * 0.62 - r.top) / r.height) * 100 + '%';
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
        const el = row.querySelector('.t-amt'); if (!el) return;
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
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
  // De video laadt pas als iemand op afspelen drukt, zodat de pagina zelf licht blijft. Op telefoon en tablet de 720p-versie.
  $('vsl-len').textContent = 'Video · ' + (c.vslLength || '3 min');
  const touch = matchMedia('(pointer: coarse)').matches;
  if (c.vsl) $('vsl-sub').textContent = (touch ? T('Tik om af te spelen', 'Tap to play') : T('Klik om af te spelen', 'Click to play')) + (c.vslLength ? ' · ' + c.vslLength : '');
  if (c.vslPoster) { $('vsl').classList.add('has-poster'); $('vsl').querySelector('.vsl-poster').hidden = false; }
  $('vsl-play').onclick = () => {
    const box = $('vsl');
    if (!c.vsl) { location.hash = '#contact'; return; }
    if (box.querySelector('video, iframe')) return;
    const src = c.vslMobiel && matchMedia('(max-width: 820px)').matches ? c.vslMobiel : c.vsl;
    const yt = c.vsl.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/), vm = c.vsl.match(/vimeo\.com\/(\d+)/);
    if (yt) box.insertAdjacentHTML('beforeend', `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen title="Video"></iframe>`);
    else if (vm) box.insertAdjacentHTML('beforeend', `<iframe src="https://player.vimeo.com/video/${vm[1]}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen title="Video"></iframe>`);
    else { box.insertAdjacentHTML('beforeend', `<video src="${src}"${c.vslPoster ? ` poster="${c.vslPoster}"` : ''} controls autoplay playsinline preload="auto"></video>`); }
  };

  /* ---------- contact ---------- */
  document.querySelectorAll('[data-c]').forEach((el) => {
    const k = el.dataset.c;
    if (k === 'tel') { el.href = 'tel:' + c.tel; el.querySelector('b').textContent = c.phone; }
    if (k === 'wa') el.href = 'https://wa.me/' + c.wa;
    if (k === 'mail') { el.href = 'mailto:' + c.mail; el.querySelector('b').textContent = c.mail; }
  });
  // de knop in de nav opent de agenda zodra er een Calendly-link in config staat; tot die tijd gaat hij naar de intake
  if (c.calendly) ['nav-cta', 'float-cta'].forEach((id) => { const b = $(id); if (!b) return; b.setAttribute('data-call', ''); b.href = c.calendly; b.removeAttribute('data-land'); });
  document.querySelectorAll('[data-call]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault(); IBEForm.call(window.__formData ? window.__formData() : {});
    if (window.IBELoader) IBELoader.busy(b, T('Agenda openen', 'Opening calendar'), 'luisteren', 1600);
  }));

  // pas na de ring: die haalt de inschuif-animatie van zijn eigen blokken af
  document.querySelectorAll('.rv').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
})();

// Planner van IBE MOTION: kiest een vrij moment uit /api/slots en boekt via /api/book (Google Agenda + Meet).
// Lukt het ophalen niet (bijv. de GitHub Pages-kopie zonder server), dan staan er WhatsApp en bellen.
(function () {
  const $ = (id) => document.getElementById(id);
  const c = window.IBE_CONFIG || {};
  const api = (p) => new URL('../api/' + p, location.href).toString();
  const TZ = 'Europe/Amsterdam';
  const fmt = (t, o) => new Intl.DateTimeFormat('nl-NL', Object.assign({ timeZone: TZ }, o)).format(new Date(t));
  const dayKey = (t) => fmt(t, { year: 'numeric', month: '2-digit', day: '2-digit' });
  const longWhen = (t, dur) => `${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })}, ${fmt(t, { hour: '2-digit', minute: '2-digit' })} tot ${fmt(t + dur * 60000, { hour: '2-digit', minute: '2-digit' })}`;
  let slots = [], dur = 30, pick = null, day = null;

  // huisstijl: dezelfde dots en leeuw-morph als op de site
  if (window.IBEDots) IBEDots($('pl-dots'), { theme: 'light', gap: 22 });
  if (window.IBEMorph) IBEMorph($('pl-morph'), { theme: 'light', shapes: ['leeuw', 'zandloper', 'netwerk'] });

  // naam en mail invullen als de link ze meegeeft (de knoppen op de site sturen ze mee, net als bij Calendly)
  const q = new URLSearchParams(location.search), form = $('st-2');
  if (q.get('name')) form.naam.value = q.get('name');
  if (q.get('email')) form.email.value = q.get('email');

  $('pl-wa').href = `https://wa.me/${c.wa}?text=${encodeURIComponent('Hoi Bob, ik wil graag een kennismaking plannen over AI en automatisering.')}`;
  $('pl-tel').href = 'tel:' + c.tel;

  function show(id) {
    ['st-1', 'st-2', 'st-3', 'st-x'].forEach((s) => { $(s).hidden = s !== id; });
    const n = { 'st-1': 0, 'st-2': 1, 'st-3': 2, 'st-x': 0 }[id];
    document.querySelectorAll('.pl-steps span').forEach((s, i) => s.classList.toggle('on', i <= n));
    if (id !== 'st-1') $('pl-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderDays() {
    const days = [...new Set(slots.map(dayKey))];
    if (!days.length) {
      $('pl-days').innerHTML = '<div class="pl-load">Alle momenten zijn op dit moment vergeven. App of bel me, dan zoeken we samen een tijd.</div>';
      $('pl-times').innerHTML = `<div class="pl-alt"><a class="btn red" href="${$('pl-wa').href}" target="_blank" rel="noopener">App Bob</a><a class="btn" href="tel:${c.tel}">Bel Bob</a></div>`;
      return;
    }
    if (!day || !days.includes(day)) day = days[0];
    $('pl-days').innerHTML = days.map((k) => {
      const t = slots.find((s) => dayKey(s) === k), n = slots.filter((s) => dayKey(s) === k).length;
      return `<button type="button" class="pl-day${k === day ? ' on' : ''}" data-k="${k}"><small>${fmt(t, { weekday: 'short' })}</small><b>${fmt(t, { day: 'numeric' })}</b><small>${fmt(t, { month: 'short' })}</small><i>${n} vrij</i></button>`;
    }).join('');
    const t0 = slots.find((s) => dayKey(s) === day);
    $('pl-times').innerHTML = `<p class="pl-dayname">${fmt(t0, { weekday: 'long', day: 'numeric', month: 'long' })}</p><div class="pl-tgrid">` +
      slots.filter((s) => dayKey(s) === day).map((s) => `<button type="button" class="pl-time" data-t="${s}">${fmt(s, { hour: '2-digit', minute: '2-digit' })}</button>`).join('') + '</div>';
  }

  $('pl-days').addEventListener('click', (e) => { const b = e.target.closest('.pl-day'); if (b) { day = b.dataset.k; renderDays(); } });
  $('pl-times').addEventListener('click', (e) => {
    const b = e.target.closest('.pl-time'); if (!b) return;
    pick = +b.dataset.t;
    $('pl-chosen').innerHTML = `<b>${longWhen(pick, dur)}</b><span>Kennismaking · 30 minuten · Google Meet</span>`;
    show('st-2');
    setTimeout(() => (form.naam.value ? form.bedrijf : form.naam).focus({ preventScroll: true }), 300);
  });
  $('pl-back').addEventListener('click', () => show('st-1'));

  async function load() {
    try {
      const r = await fetch(api('slots'), { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      slots = j.slots || []; dur = j.duration || 30;
      renderDays();
    } catch (e) { show('st-x'); }
  }

  function err(msg) { const p = $('pl-err'); p.textContent = msg; p.hidden = !msg; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err('');
    const tijd = [...document.querySelectorAll('#pl-tijd input:checked')].map((i) => i.value);
    const d = {
      start: pick, naam: form.naam.value.trim(), bedrijf: form.bedrijf.value.trim(), email: form.email.value.trim(),
      telefoon: form.telefoon.value.trim(), mensen: form.mensen.value, tijd, software: form.software.value.trim(), website: form.website.value,
    };
    const miss = [];
    if (!d.naam) miss.push('je naam'); if (!d.bedrijf) miss.push('je bedrijf');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) miss.push('een geldig e-mailadres');
    if (d.telefoon.replace(/\D/g, '').length < 8) miss.push('je telefoonnummer');
    if (!d.mensen) miss.push('hoeveel mensen er op kantoor werken'); if (!tijd.length) miss.push('waar de meeste tijd in gaat');
    if (miss.length) return err('Vul nog in: ' + miss.join(', ') + '.');
    const go = $('pl-go'); go.disabled = true; go.firstChild.textContent = 'Bezig met plannen… ';
    try {
      const r = await fetch(api('book'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) { err('Dit moment is net door iemand anders geboekt. Kies een ander moment.'); await load(); setTimeout(() => show('st-1'), 1600); return; }
      if (!r.ok || !j.ok) throw new Error(j.error || r.status);
      $('pl-when').textContent = longWhen(j.start || pick, dur);
      if (j.meet) { $('pl-meet').href = j.meet; $('pl-meet').hidden = false; }
      show('st-3');
    } catch (x) {
      err('Er ging iets mis bij het plannen. Probeer het nog een keer, of app me even.');
    } finally { go.disabled = false; go.firstChild.textContent = 'Bevestig de kennismaking '; }
  });

  load();
})();

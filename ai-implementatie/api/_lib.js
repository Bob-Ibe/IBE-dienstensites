// IBE MOTION · eigen planner (vervangt Calendly). Gedeelde code voor /api/slots en /api/book.
// Bestanden met een _ ervoor worden door Vercel niet als losse route gezien.
//
// Hoe het werkt: we lezen je drukke momenten uit Google Agenda (dezelfde agenda die Akiflow gebruikt)
// en zetten een boeking daar als afspraak met Google Meet-link. Akiflow neemt hem dan vanzelf over.
// De sleutels staan als Environment Variables in Vercel (zie PLANNER-INSTELLEN.md), nooit in de code.

// Wanneer mensen kunnen boeken. Dag: 0 = zondag, 1 = maandag, 2 = dinsdag, 3 = woensdag, ...
const RULES = {
  2: [['13:00', '17:00']], // dinsdag
  3: [['17:00', '21:00']], // woensdag
};
const TZ = 'Europe/Amsterdam';
const DURATION = 30; // minuten per kennismaking
const STEP = 30; // om de hoeveel minuten er een starttijd is
const BUFFER = 15; // minuten vrij voor en na een andere afspraak
const MIN_NOTICE_H = 24; // minstens zoveel uur van tevoren boeken
const MAX_DAYS = 21; // tot zoveel dagen vooruit

const env = (k) => (process.env[k] || '').trim();
const CAL = () => env('GOOGLE_CALENDAR_ID') || 'primary';
const MOCK = () => env('IBE_PLAN_MOCK') === '1'; // alleen voor lokaal testen, zonder Google

// ---------- tijd in Amsterdam, zonder libraries ----------
function tzOffsetMin(utcMs) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - utcMs) / 60000);
}
// lokale Amsterdamse tijd -> UTC-milliseconden
function amsToUtc(y, m, d, hh, mm) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffsetMin(guess) * 60000;
  t = guess - tzOffsetMin(t) * 60000; // tweede keer klopt ook rond de zomertijdwissel
  return t;
}
function amsDate(utcMs) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
    .formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}

// alle mogelijke starttijden volgens de regels (nog zonder agenda)
function candidates(now = Date.now()) {
  const out = [], first = now + MIN_NOTICE_H * 3600000;
  for (let i = 0; i <= MAX_DAYS; i++) { // vandaag plus 21 hele dagen
    const day = amsDate(now + i * 86400000);
    for (const [a, b] of RULES[day.dow] || []) {
      const [ah, am] = a.split(':').map(Number), [bh, bm] = b.split(':').map(Number);
      const end = amsToUtc(day.y, day.m, day.d, bh, bm);
      for (let t = amsToUtc(day.y, day.m, day.d, ah, am); t + DURATION * 60000 <= end; t += STEP * 60000) {
        if (t >= first) out.push(t);
      }
    }
  }
  return [...new Set(out)].sort((x, y) => x - y);
}

// ---------- Google ----------
async function token() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'),
      refresh_token: env('GOOGLE_REFRESH_TOKEN'), grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error('google-token: ' + (j.error || r.status));
  return j.access_token;
}

async function busy(fromMs, toMs, tok) {
  if (MOCK()) {
    // nep-agenda: de eerste dinsdag om 14:00 is al bezet
    const c = candidates().find((t) => amsDate(t).dow === 2);
    return c ? [[c + 60 * 60000, c + 90 * 60000]] : [];
  }
  const r = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin: new Date(fromMs).toISOString(), timeMax: new Date(toMs).toISOString(), timeZone: TZ, items: [{ id: CAL() }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('google-freebusy: ' + r.status);
  const cal = Object.values(j.calendars || {})[0] || {};
  if (cal.errors && cal.errors.length) throw new Error('google-freebusy: ' + cal.errors[0].reason);
  return (cal.busy || []).map((b) => [Date.parse(b.start), Date.parse(b.end)]);
}

function freeSlots(cands, busyList) {
  const pad = BUFFER * 60000, len = DURATION * 60000;
  return cands.filter((t) => !busyList.some(([s, e]) => t - pad < e && t + len + pad > s));
}

async function available() {
  const cands = candidates();
  if (!cands.length) return [];
  const tok = MOCK() ? null : await token();
  const list = await busy(cands[0] - 3600000, cands[cands.length - 1] + 3 * 3600000, tok);
  return freeSlots(cands, list);
}

async function createEvent(startMs, f) {
  const endMs = startMs + DURATION * 60000;
  const lines = [
    'Kennismaking IBE MOTION · AI & automatisering',
    'In 30 minuten kijken we waar je tijd nu heen gaat en wat er bij jouw bedrijf te winnen valt.',
    'Bob Ibe · IBE MOTION · 06 55 11 60 82 · ai.ibemotion.nl',
    '',
    `Naam: ${f.naam}`,
    `Bedrijf: ${f.bedrijf}`,
    `E-mail: ${f.email}`,
    `Telefoon: ${f.telefoon}`,
    '',
    `Mensen op kantoor: ${f.mensen}`,
    `Meeste tijd gaat in: ${f.tijd.join(', ')}`,
    `Software nu: ${f.software || '-'}`,
  ];
  if (MOCK()) return { id: 'mock', hangoutLink: 'https://meet.google.com/abc-defg-hij', start: startMs, end: endMs, description: lines.join('\n') };
  const tok = await token();
  // vlak voor het boeken nog een keer kijken of het tijdstip echt vrij is (twee mensen tegelijk)
  const list = await busy(startMs - 3600000, endMs + 3600000, tok);
  if (!freeSlots([startMs], list).length) { const e = new Error('bezet'); e.code = 409; throw e; }
  const body = {
    summary: `IBE MOTION × ${f.bedrijf} · Kennismaking AI & automatisering`,
    description: lines.join('\n'),
    start: { dateTime: new Date(startMs).toISOString(), timeZone: TZ },
    end: { dateTime: new Date(endMs).toISOString(), timeZone: TZ },
    attendees: [{ email: f.email, displayName: f.naam }],
    conferenceData: { createRequest: { requestId: 'ibe-' + startMs + '-' + Math.random().toString(36).slice(2, 8), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    reminders: { useDefault: true },
    extendedProperties: { private: { bron: 'ibe-planner' } },
  };
  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CAL())}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('google-insert: ' + r.status + ' ' + ((j.error && j.error.message) || ''));
  return { id: j.id, hangoutLink: j.hangoutLink || '', start: startMs, end: endMs };
}

const configured = () => MOCK() || (env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET') && env('GOOGLE_REFRESH_TOKEN'));

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

module.exports = { candidates, available, createEvent, configured, send, amsDate, DURATION, TZ };

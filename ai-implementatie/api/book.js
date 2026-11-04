// POST /api/book → zet de kennismaking in Google Agenda (met Meet-link en uitnodiging naar de klant).
// Alleen tijden die /api/slots ook zou geven worden geaccepteerd.
const { available, createEvent, configured, send } = require('./_lib');

const MENSEN = ['Alleen ik', '2 tot 5', '6 tot 15', '16 tot 50', 'Meer dan 50'];
const TIJD = ['Mail en klantvragen', 'Offertes', 'Administratie en facturen', 'Planning', 'Rapportages', 'Iets anders'];
const clean = (s, n = 200) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  if (!configured()) return send(res, 503, { error: 'setup' });
  // alleen JSON: een gewoon formulier van een andere site kan zo niets insturen
  if (!/application\/json/i.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'invoer' });
  let b;
  try { b = await readBody(req); } catch (e) { return send(res, 400, { error: 'invoer' }); }
  if (b.website) return send(res, 200, { ok: true }); // honeypot: bots vullen dit veld in
  const f = {
    naam: clean(b.naam, 80), bedrijf: clean(b.bedrijf, 120), email: clean(b.email, 160), telefoon: clean(b.telefoon, 30),
    mensen: MENSEN.includes(b.mensen) ? b.mensen : '',
    tijd: (Array.isArray(b.tijd) ? b.tijd : []).filter((x) => TIJD.includes(x)),
    software: clean(b.software, 200),
  };
  const start = Number(b.start);
  if (!f.naam || !f.bedrijf || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email) || f.telefoon.replace(/\D/g, '').length < 8 || !f.mensen || !f.tijd.length) {
    return send(res, 400, { error: 'invoer' });
  }
  try {
    if (!(await available()).includes(start)) return send(res, 409, { error: 'bezet' });
    const ev = await createEvent(start, f);
    send(res, 200, { ok: true, start: ev.start, end: ev.end, meet: ev.hangoutLink });
  } catch (e) {
    console.error(e);
    if (e.code === 409 || e.code === 429) return send(res, e.code, { error: e.code === 409 ? 'bezet' : 'te-veel' });
    send(res, 502, { error: 'agenda' });
  }
};

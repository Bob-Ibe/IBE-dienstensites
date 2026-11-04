// GET /api/slots → de vrije starttijden voor een kennismaking (UTC-milliseconden), de pagina zet ze om naar Nederlandse tijd.
const { available, configured, send, DURATION } = require('./_lib');

module.exports = async (req, res) => {
  if (!configured()) return send(res, 503, { error: 'setup' });
  try {
    send(res, 200, { duration: DURATION, slots: await available() });
  } catch (e) {
    console.error(e);
    send(res, 502, { error: 'agenda' });
  }
};

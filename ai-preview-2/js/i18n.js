// Taal van de AI-site: Nederlands (standaard) of Engels.
// Alleen Nederlands zichtbaar; Engels staat nog klaar via ?lang=en achter de link.
// Vaste teksten: elk element met data-i="sleutel" krijgt in het Engels de tekst uit js/en.js.
// Attributen: data-i-attr="aria-label:sleutel;title:sleutel2". Teksten die JS maakt gebruiken IBEI18n.t('nl', 'en').
(function () {
  // Sinds 4 nov staat de taalknop uit: de site is alleen Nederlands. Engels kan nog met ?lang=en (voor later).
  let lang = 'nl';
  try { if (new URLSearchParams(location.search).get('lang') === 'en') lang = 'en'; } catch (e) {}
  const EN = lang === 'en', D = window.IBE_EN || {};
  document.documentElement.lang = lang;

  if (EN) {
    document.querySelectorAll('[data-i]').forEach((el) => { const v = D[el.dataset.i]; if (v != null) el.innerHTML = v; });
    document.querySelectorAll('[data-i-attr]').forEach((el) => el.dataset.iAttr.split(';').forEach((p) => {
      const [a, k] = p.split(':'); if (D[k] != null) el.setAttribute(a, D[k]);
    }));
  }

  const btn = document.getElementById('lang-btn');
  if (btn) {
    btn.classList.toggle('en', EN);
    btn.setAttribute('aria-label', EN ? 'Nederlandse versie' : 'English version');
    btn.addEventListener('click', () => {
      const u = new URL(location.href);
      u.searchParams.set('lang', EN ? 'nl' : 'en');
      location.href = u.toString();
    });
  }

  const loc = EN ? 'en-GB' : 'nl-NL';
  const num = (n, d = 0) => n.toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
  window.IBEI18n = {
    lang, en: EN, loc,
    t: (nl, en) => (EN && en !== undefined ? en : nl),
    num,
    eur: (n) => (EN ? '€' : '€ ') + num(Math.round(n)),
  };
})();

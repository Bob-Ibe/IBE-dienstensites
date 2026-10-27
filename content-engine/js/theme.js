// Licht of donker. De stand wordt al in de <head> gezet (geen flits); de knop met zon/maan wisselt, onthoudt de keuze
// en laadt de pagina opnieuw, zodat de stippen, de morph en de overgangen meteen in de juiste kleuren tekenen.
window.IBETheme = function () {
  const light = document.documentElement.dataset.theme === 'light';
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    const label = light ? 'Donkere modus' : 'Lichte modus';
    b.setAttribute('aria-label', label); b.title = label;
    b.addEventListener('click', () => {
      try { localStorage.setItem('ibe-ce-theme', light ? 'dark' : 'light'); } catch (e) {}
      document.documentElement.dataset.theme = light ? 'dark' : 'light';
      location.reload();
    });
  });
  return light ? 'light' : 'dark';
};

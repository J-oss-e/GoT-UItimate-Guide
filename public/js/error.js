(function () {
  const params = new URLSearchParams(location.search);
  const name = params.get('name') || params.get('characterName') || '';
  const qEl = document.getElementById('q');
  if (qEl && name) qEl.textContent = name;

  const target = '/';
  let s = 5;
  const el = document.getElementById('secs');

  const tick = () => {
    if (el) el.textContent = String(s);
    if (s <= 0) {

      location.replace(target);
      return;
    }
    s -= 1;
    setTimeout(tick, 1000);
  };

  tick();
})();


document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[action="character.html"]');
  if (!form) return;
  const input = form.querySelector('input[name="characterName"]');

  form.addEventListener('submit', (e) => {
    const name = (input?.value || '').trim();
    if (!name) {
      e.preventDefault();
      input?.focus();
    }
  });
});

document.querySelectorAll('.choice-form').forEach(form => {
  let submitted = false;
  form.addEventListener('submit', event => {
    if (submitted) { event.preventDefault(); return; }
    submitted = true;
    form.setAttribute('aria-busy', 'true');
    // Do not disable the submitter: its name/value is needed in the POST.
    form.classList.add('submitting');
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    const index = Number(event.key) - 1;
    if (/^[1-9]$/.test(event.key) && !submitted) {
      const button = [...form.querySelectorAll('.game-choice')].filter(b => !b.closest('.game-option').hidden)[index];
      if (button) form.requestSubmit(button);
    }
  });
});
const share = document.querySelector('#share-button');
if (share) share.addEventListener('click', async () => {
  const input = document.querySelector('#share-link');
  const status = document.querySelector('#share-status');
  input.focus(); input.select();
  status.textContent = 'Link selected. Copy it with Ctrl+C or Command+C, or use your device copy menu.';
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await Promise.race([
        navigator.clipboard.writeText(input.value),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Clipboard timeout')), 1500))
      ]);
      status.textContent = 'Link copied. Send it to your friends!';
      share.textContent = 'Copied ✓';
    }
  } catch (error) {
    // The link is already selected for manual copying if permission is denied.
  }
});
window.addEventListener('pageshow', event => { if (event.persisted && document.querySelector('.submitting')) window.location.reload(); });

// Preserve a readable title card when an external image fails.
document.querySelectorAll('.game-cover-image').forEach(image => {
  const fallback = () => { image.closest('.cover').classList.remove('cover--image'); image.hidden = true; };
  image.addEventListener('error', fallback);
  if (image.complete && image.naturalWidth === 0) fallback();
});

const showOtherGames = document.querySelector('#show-other-games');
if (showOtherGames) {
  const cards = [...document.querySelectorAll('.game-option')];
  const initialCount = 12;
  const status = document.querySelector('#games-visible-status');
  if (cards.length > initialCount) {
    cards.slice(initialCount).forEach(card => { card.hidden = true; });
    showOtherGames.hidden = false;
    status.textContent = `Showing ${initialCount} of ${cards.length} games`;
    showOtherGames.addEventListener('click', () => {
      const expanded = showOtherGames.getAttribute('aria-expanded') !== 'true';
      cards.slice(initialCount).forEach(card => { card.hidden = !expanded; });
      showOtherGames.setAttribute('aria-expanded', String(expanded));
      showOtherGames.textContent = expanded ? 'Show fewer games' : 'Show all available games';
      status.textContent = `Showing ${expanded ? cards.length : initialCount} of ${cards.length} games`;
    });
  }
}

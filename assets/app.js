'use strict';
let games,
  byId,
  years,
  run = null;
const main = document.querySelector('#main');
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const safeURL = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? escapeHTML(url.href) : '#';
  } catch {
    return '#';
  }
};
function persist() {
  try {
    localStorage.setItem('save-one-run', JSON.stringify(run));
  } catch {
    document
      .querySelector('#storage-status')
      ?.replaceChildren('Progress could not be saved on this device. Keep this tab open.');
  }
}
function validate(value, complete = false) {
  if (
    !value ||
    value.v !== 1 ||
    typeof value.name !== 'string' ||
    value.name.length > 40 ||
    !Array.isArray(value.years) ||
    !value.years.length ||
    value.years.length > years.length ||
    !Array.isArray(value.picks) ||
    value.picks.length > value.years.length
  )
    throw Error('Invalid collection code.');
  if (value.years.some((y, i) => !years.includes(y) || (i && y !== value.years[i - 1] + 1)))
    throw Error('Invalid years in collection.');
  if (
    value.picks.some(
      (id, i) => typeof id !== 'string' || !byId.has(id) || byId.get(id).year !== value.years[i],
    )
  )
    throw Error('A game does not match its release year.');
  if (complete && value.picks.length !== value.years.length)
    throw Error('Only completed collections can be imported.');
  return { v: 1, name: value.name, years: value.years, picks: value.picks };
}
function encode(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return (
    'SO1.' +
    btoa(String.fromCharCode(...bytes))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '')
  );
}
function decode(code) {
  code = code.trim();
  if (code.startsWith('http')) {
    const url = new URL(code);
    code = new URLSearchParams(url.hash.slice(1)).get('collection') || '';
  }
  if (!/^SO1\.[A-Za-z0-9_-]+$/.test(code) || code.length > 24000)
    throw Error('Paste a valid Save One code or collection link.');
  const raw = atob(code.slice(4).replaceAll('-', '+').replaceAll('_', '/'));
  return validate(
    JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(raw, (c) => c.charCodeAt(0)),
      ),
    ),
    true,
  );
}
function cover(g) {
  return `<div class="cover cover--image"><img class="game-cover-image" src="${safeURL(g.cover_url)}" alt="${escapeHTML(g.title)} game artwork" loading="lazy" referrerpolicy="no-referrer"><div class="cover-title">${escapeHTML(g.title)}</div></div>`;
}
function wireImages() {
  main.querySelectorAll('img').forEach((img) => {
    const fallback = () => {
      img.hidden = true;
      img.parentElement.classList.remove('cover--image');
    };
    img.addEventListener('error', fallback);
    if (img.complete && !img.naturalWidth) fallback();
  });
}
function order(year) {
  const preferred =
    /^(pac-man$|adventure$|donkey kong$|galaga$|super mario|sonic the hedgehog|the legend of zelda|pokémon (red|gold|ruby|diamond|x |sun|sword|scarlet|legends)|grand theft auto|half-life|doom$|resident evil 4$|minecraft$|elden ring$|baldur.s gate 3|the witcher 3|red dead redemption|the last of us|final fantasy|metal gear solid|street fighter ii$)/i;
  const secondary =
    /collection|compilation|remaster|trilogy|game & watch|cement factory|jr\. math/i;
  return games
    .filter((g) => g.year === year)
    .sort(
      (a, b) =>
        Number(secondary.test(a.title)) - Number(secondary.test(b.title)) ||
        Number(preferred.test(b.title)) - Number(preferred.test(a.title)),
    );
}
function home() {
  document.title = 'Save One';
  const options = (selected) =>
    years.map((y) => `<option ${y === selected ? 'selected' : ''}>${y}</option>`).join('');
  main.innerHTML = `<section class="hero"><div><p class="eyebrow">Your gaming history, one year at a time</p><h1>One year.<br>One favourite.</h1><p class="lead">Pick the game you'd keep from each year.<br>Build a collection and share it with friends.</p><div class="hero-actions"><a class="button primary" href="#start">Start a collection →</a>${run ? '<button class="button secondary" id="resume">Continue collection</button>' : ''}</div><div class="hero-stats"><div><strong>${years.length}</strong><span>Years to explore</span></div><div><strong>${games.length}</strong><span>Games to choose from</span></div><div><strong>1</strong><span>Pick each year</span></div></div></div><div class="hero-art"><div class="art-grid">${[...order(1998).slice(0, 3), ...order(2015).slice(0, 3)].map(cover).join('')}</div></div></section><section class="start-section" id="start"><div><p class="eyebrow">Choose your years</p><h2>Where do you<br>want to start?</h2><p class="muted">Pick your favourites, discover your top genres, and share a code with friends. No account needed.</p></div><form class="start-form" id="start-form"><h3>Make it yours</h3><label for="nickname">Your name (optional)</label><input id="nickname" maxlength="40" autocomplete="nickname"><div class="field-grid"><div><label for="start-year">Start year</label><select id="start-year">${options(years[0])}</select></div><div><label for="end-year">End year</label><select id="end-year">${options(years.at(-1))}</select></div></div><p id="start-error" role="alert"></p><button class="button primary wide">Start picking →</button><p class="small muted">Progress stays on this device. Starting a new collection replaces your saved run.</p></form></section><section class="import-section"><form class="start-form" id="import-form"><h3>Import a collection</h3><p class="muted">Paste a friend's code or collection link to see their picks.</p><label for="import-code">Collection code</label><textarea id="import-code" required rows="4" maxlength="24000" placeholder="SO1.…"></textarea><p id="import-error" role="alert"></p><button class="button secondary">Import collection</button></form></section>`;
  document.querySelector('#resume')?.addEventListener('click', () => {
    location.hash = '#play';
  });
  document.querySelector('#start-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const first = Number(document.querySelector('#start-year').value),
      last = Number(document.querySelector('#end-year').value);
    if (first > last) {
      document.querySelector('#start-error').textContent = 'End year must be after the start year.';
      return;
    }
    run = {
      v: 1,
      name: document.querySelector('#nickname').value.trim() || 'Player',
      years: years.filter((y) => y >= first && y <= last),
      picks: [],
    };
    persist();
    location.hash = '#play';
    if (location.hash === '#play') play();
  });
  document.querySelector('#import-form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const collection = decode(document.querySelector('#import-code').value);
      location.hash = '#collection=' + encode(collection);
    } catch (error) {
      document.querySelector('#import-error').textContent = error.message;
    }
  });
  wireImages();
}
function undo() {
  if (run?.picks.length) {
    run.picks.pop();
    persist();
    location.hash = '#play';
    play();
  }
}
function play() {
  if (!run) {
    home();
    return;
  }
  if (run.picks.length === run.years.length) {
    results(run, true);
    return;
  }
  const index = run.picks.length,
    year = run.years[index],
    choices = order(year);
  document.title = `${year} — Save One`;
  main.innerHTML = `<section class="play-shell"><div class="play-top"><a href="#home">← Take a break</a><span>${escapeHTML(run.name)}'s collection</span><span>${index + 1} / ${run.years.length} years</span></div>${index ? '<button class="button secondary undo-form" id="undo">Undo last pick</button>' : ''}<div class="progress" role="progressbar" aria-label="Years completed" aria-valuenow="${index}" aria-valuemin="0" aria-valuemax="${run.years.length}"><span style="width:${(index / run.years.length) * 100}%"></span></div><div class="round-heading"><p class="eyebrow">${choices.length} games. Pick your favourite.</p><h1>${year}</h1><p class="muted">If you could only keep one, which would it be?</p></div><div class="game-grid">${choices.map((g, i) => `<div class="game-option" ${i >= 12 ? 'hidden' : ''}><button class="game-choice" data-game="${escapeHTML(g.id)}" aria-label="Save ${escapeHTML(g.title)}">${cover(g)}<div class="choice-caption"><span>${escapeHTML(g.title)}<small>${escapeHTML(g.genre)}</small></span><span class="save-arrow">↗</span></div></button><p class="game-sources"><a href="${safeURL(g.source_url)}" target="_blank" rel="noopener">Game info</a> · <a href="${safeURL(g.image_source_url)}" target="_blank" rel="noopener">Image credits</a></p></div>`).join('')}</div><div class="more-games"><button class="button secondary" id="more" aria-expanded="false">Show all available games</button><p class="small muted" id="count">Showing ${Math.min(12, choices.length)} of ${choices.length} games</p><p class="small muted">API catalogue: verified first-release dates and artwork. Some releases may be missing.</p></div><p id="storage-status" role="status"></p></section>`;
  document.querySelector('#undo')?.addEventListener('click', undo);
  document.querySelector('#more').addEventListener('click', (event) => {
    const expanded = event.target.getAttribute('aria-expanded') !== 'true';
    main.querySelectorAll('.game-option').forEach((card, i) => {
      card.hidden = !expanded && i >= 12;
    });
    event.target.setAttribute('aria-expanded', expanded);
    event.target.textContent = expanded ? 'Show fewer games' : 'Show all available games';
    document.querySelector('#count').textContent =
      `Showing ${expanded ? choices.length : Math.min(12, choices.length)} of ${choices.length} games`;
  });
  main.querySelectorAll('[data-game]').forEach((button) =>
    button.addEventListener('click', () => {
      if (run.picks.length !== index) return;
      run.picks.push(button.dataset.game);
      persist();
      play();
      window.scrollTo(0, 0);
    }),
  );
  wireImages();
}
function stats(value) {
  const counts = new Map();
  value.picks.forEach((id) => {
    const genre = byId.get(id).genre;
    counts.set(genre, (counts.get(genre) || 0) + 1);
  });
  return [...counts].sort((a, b) => b[1] - a[1]);
}
function results(value, owned) {
  document.title = `${value.name}'s collection — Save One`;
  const code = encode(value),
    link = new URL(location.href);
  link.hash = 'collection=' + code;
  const genres = stats(value),
    pct = (n) => Math.round((n / value.picks.length) * 100);
  main.innerHTML = `<section class="result-hero"><p class="eyebrow">${owned ? 'Collection complete' : 'Imported collection'}</p><h1>${escapeHTML(value.name)}'s<br>collection.</h1><p class="lead">${value.picks.length} game${value.picks.length === 1 ? '' : 's'} · ${value.years[0]}–${value.years.at(-1)}</p><div class="share-box"><label for="share-code">Share code — contains every pick</label><textarea id="share-code" readonly rows="3">${code}</textarea><div class="result-actions"><button class="button primary" id="copy-code">Copy code</button><button class="button secondary" id="copy-link">Copy link</button><button class="button secondary" id="download">Download collection image</button>${owned ? '<button class="button secondary" id="undo">Undo last pick</button>' : ''}</div><p id="share-status" role="status">Friends can import this code on the homepage. Codes include your name and picks.</p></div><div class="top-genres">${genres
    .slice(0, 3)
    .map(
      ([genre, n], i) =>
        `<article><span class="small muted">${i + 1} · Favourite genre</span><h3>${escapeHTML(genre)}</h3><p>${n} pick${n === 1 ? '' : 's'} · ${pct(n)}%</p></article>`,
    )
    .join(
      '',
    )}</div></section><section class="genre-section"><div><h2>Your favourite genres</h2><p class="muted">Based on saved games, not tracked playtime.</p><a class="button secondary" href="#home">Start a collection →</a></div><div class="genre-bars">${genres.map(([genre, n]) => `<div class="genre-row"><div><strong>${escapeHTML(genre)}</strong><span>${n} saved · ${pct(n)}%</span></div><div class="bar"><span style="width:${pct(n)}%"></span></div></div>`).join('')}</div></section><section class="collection"><div class="section-heading"><h2>The full collection</h2></div><div class="collection-grid">${value.picks
    .map((id) => {
      const g = byId.get(id);
      return `<article>${cover(g)}<p><span>${g.year}</span>${escapeHTML(g.title)}</p></article>`;
    })
    .join('')}</div></section>`;
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      document.querySelector('#share-status').textContent = 'Copied. Send it to a friend.';
    } catch {
      const field = document.querySelector('#share-code');
      field.value = text;
      field.focus();
      field.select();
      document.querySelector('#share-status').textContent =
        'Selected. Use your device’s copy command.';
    }
  };
  document.querySelector('#copy-code').onclick = () => copy(code);
  document.querySelector('#copy-link').onclick = () => copy(link.href);
  document.querySelector('#undo')?.addEventListener('click', undo);
  document.querySelector('#download').onclick = () => poster(value);
  wireImages();
}
function poster(value) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 350 + Math.ceil(value.picks.length / 2) * 130;
  const c = canvas.getContext('2d');
  c.fillStyle = '#171b19';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = '#89c5a6';
  c.font = '24px Arial';
  c.fillText('SAVE ONE', 50, 55);
  c.fillStyle = '#edf1ec';
  c.font = '44px Arial';
  c.fillText(`${value.name}'s collection`, 50, 120, 1100);
  c.font = '23px Arial';
  c.fillStyle = '#a6b0a8';
  c.fillText(`${value.years[0]}–${value.years.at(-1)} · ${value.picks.length} games`, 50, 173);
  c.fillStyle = '#89c5a6';
  c.font = '20px Arial';
  c.fillText(
    'Top genres: ' +
      stats(value)
        .slice(0, 3)
        .map(([g, n]) => `${g} (${n})`)
        .join(' · '),
    50,
    225,
    1100,
  );
  value.picks.forEach((id, i) => {
    const g = byId.get(id),
      x = 50 + (i % 2) * 560,
      y = 270 + Math.floor(i / 2) * 130;
    c.fillStyle = '#202622';
    c.fillRect(x, y, 540, 115);
    c.fillStyle = '#89c5a6';
    c.font = '19px Arial';
    c.fillText(`${g.year} · ${g.genre}`, x + 18, y + 28);
    c.fillStyle = '#edf1ec';
    c.font = '23px Arial';
    let line = '',
      lines = [];
    g.title.split(' ').forEach((word) => {
      const next = (line + ' ' + word).trim();
      if (line && c.measureText(next).width > 502) {
        lines.push(line);
        line = word;
      } else line = next;
    });
    lines.push(line);
    lines
      .slice(0, 2)
      .forEach((text, j) =>
        c.fillText(text + (j === 1 && lines.length > 2 ? '…' : ''), x + 18, y + 60 + j * 28, 502),
      );
  });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'save-one-collection.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
function route() {
  try {
    if (location.hash.startsWith('#collection=')) {
      results(decode(location.hash.slice(12)), false);
    } else if (location.hash === '#play') {
      play();
    } else {
      home();
    }
  } catch (error) {
    home();
    document.querySelector('#import-error').textContent = error.message;
  }
}
document.addEventListener('keydown', (event) => {
  if (
    location.hash !== '#play' ||
    /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName) ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.repeat
  )
    return;
  if (/^[1-9]$/.test(event.key)) {
    const cards = [...main.querySelectorAll('.game-option')].filter((e) => !e.hidden);
    cards[Number(event.key) - 1]?.querySelector('button').click();
  }
});
Promise.all([
  fetch('data/games.json').then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  }),
  fetch('data/archive.json').then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  }),
])
  .then(([catalog, archive]) => {
    games = catalog.games;
    byId = new Map([...archive.games, ...games].map((g) => [g.id, g]));
    years = [...new Set(games.map((g) => g.year))].sort((a, b) => a - b);
    try {
      const saved = localStorage.getItem('save-one-run');
      if (saved) run = validate(JSON.parse(saved));
    } catch {}
    window.addEventListener('hashchange', route);
    route();
  })
  .catch(() => {
    main.innerHTML =
      '<section class="result-hero"><h1>Games could not load.</h1><p>Refresh to try again. For local preview, serve this folder with an HTTP server.</p></section>';
  });

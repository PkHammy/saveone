import React from 'react';
import { createRoot } from 'react-dom/client';
import { initialize } from './lib/catalogue.js';
import App from './App.jsx';
import '@mantine/core/styles.css';
import '../assets/style.css';

const root = createRoot(document.querySelector('#root'));
root.render(<p className="loading">Loading games…</p>);
Promise.all(
  ['games', 'archive', 'share-years'].map((name) =>
    fetch(`data/${name}.json`).then((r) => {
      if (!r.ok) throw Error();
      return r.json();
    }),
  ),
)
  .then(([catalog, archive, perYear]) => {
    initialize(catalog.games, archive.games, perYear);
    root.render(<App />);
  })
  .catch(() =>
    root.render(
      <p className="loading" role="alert">
        Games could not load. Refresh to try again.
      </p>,
    ),
  );

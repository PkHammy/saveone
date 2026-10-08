# Save One

Made by [Hammy](https://github.com/PkHammy) with help of AI.

A React game built with Vite and hosted as a static site. Choose one favourite from each release year, see your top genres, and share a self-contained collection code. No backend, database, Docker, accounts, or API keys.

## Preview locally

Install Node.js 22.12 or newer, then run:

```sh
npm ci
npm run dev
```

Open the local address Vite prints. Use `npm run build` to create the static site in `dist/`, and `npm run preview` to check that build locally.

## Publish free on GitHub Pages

1. Commit and push this folder to the `main` branch of your GitHub repository.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. The included Pages workflow installs dependencies, runs the checks, builds the React app, and publishes `dist/`. Run it from the Actions tab or push a commit.
4. Open the website URL shown by the completed deployment. Project repository subpaths are supported.

No hosting credentials are bundled. GitHub Pages builds the site automatically after a push; select GitHub Actions as the publishing source.

## Gameplay and sharing

- Progress and theme preference stay in your browser's local storage. Clearing browser storage loses the current run; save a completed share code to keep it.
- Undo revisits the previous year, including from completed results.
- Twelve choices appear initially. Expand to see the rest of the available year catalogue.
- After completing a collection, start a randomly shuffled knockout tournament to choose your all-time favourite. Odd rounds give one game a bye. Undo matches or shuffle and restart; tournament progress stays on the device and does not change the collection code. Imported collections can play too. Results show the champion’s road to the title and a dialog with expandable rounds and every matchup.
- Completed results separate your collection, tournament, and genre breakdown into tabs, with a sharing dialog and downloadable PNG poster.
- Codes start with S and pack the entire collection into one number using each year's actual game count. The year range and custom UTF-8 name are included; the default Player name needs no extra space. Only the current format is supported. This is reversible encoding, not encryption.
- The homepage imports a code or collection link. Imported collections do not overwrite your saved progress and cannot undo someone else's picks.
- Collection links keep their data in the URL fragment, so there is no collection database. Recipients need the same frozen data/share-years.json manifest. Do not change its years, game ordering, or array lengths: all are part of the encoding. A future catalogue expansion needs a new format identifier. Keep archived records for the manifest's games. Tests enforce this snapshot.
- Codes are validated for size, version, known IDs, complete choices, and matching release years. They are user-editable and do not certify authenticity.

## Catalogue and artwork

`data/games.json` contains 3,003 Wikipedia/Wikidata-sourced games from 1980–2025. It is a popular-title selection, not a sales ranking or every release ever made. Dates and artwork determine availability. Familiar games appear earlier; compilations and remasters appear later. `data/archive.json` retains retired entries so previous codes can still resolve them.

Artwork loads from Wikimedia, with title fallbacks if unavailable. Image source links are shown on the play screen. Internet access is needed for artwork. Genre totals describe saved games, not played time. Review source image licensing before commercial use.

## Checks

Run the logic checks and production build before publishing:

```sh
npm test
npm run build
```



## Source structure

- `src/main.jsx` loads the catalogue and mounts React.
- `src/App.jsx` manages the active collection and chooses the screen.
- `src/pages/` contains Home, Play, and Results.
- `src/components/` contains shared UI, sharing controls, and the tournament.
- `src/hooks/` manages collection progress, tournaments, the URL hash, and theme preference.
- `src/lib/` contains catalogue, collection codes, tournament rules, storage, URLs, and poster export.
- `src/theme.js` configures Mantine controls, typography, and colours. Tabler provides the icons.
- `assets/style.css` loads the responsive light and dark styles from `assets/styles/`, grouped by screen.


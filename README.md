# Save One

Made by [Hammy](https://github.com/PkHammy) with help of AI.

A static HTML, CSS, and JavaScript game. Choose one favourite from each release year, see your top genres, and share a self-contained collection code. No backend, database, Docker, accounts, build step, or API keys.

## Preview locally

Open this folder in VS Code and use the **Live Server** extension to preview `index.html`. No Python or uv is required.

Use the address shown by Live Server. The JSON catalogue needs an HTTP preview, so opening index.html directly from disk is not supported.

## Publish free on GitHub Pages

1. Commit and push this folder to the `main` branch of your GitHub repository.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. The included Pages workflow checks JavaScript and uploads only `index.html`, `assets/`, and `data/`. Run it from the Actions tab or push a commit.
4. Open the website URL shown by the completed deployment. Project repository subpaths are supported.

No hosting credentials are bundled. This project is ready to deploy but has not been published by this conversion.

## Gameplay and sharing

- Progress and theme preference stay in your browser's local storage. Clearing browser storage loses the current run; save a completed share code to keep it.
- Undo revisits the previous year, including from completed results.
- Twelve choices appear initially. Expand to see the rest of the available year catalogue.
- Completed results show the full collection and top three genres, with a downloadable PNG poster.
- New share codes use SO2: the start year, number of picks, UTF-8 player name, and permanent 16-bit game IDs encoded as URL-safe Base64. Existing SO1 JSON codes and links remain importable. It is reversible, not a hash or encryption. Anyone holding the code can read it.
- The homepage imports a code or collection link. Imported collections do not overwrite your saved progress and cannot undo someone else's picks.
- Collection links keep their data in the URL fragment, so there is no collection database. Recipients load the same catalogue to decode the IDs. Keep existing IDs and archived records when updating the catalogue. The positions in data/share-ids.json are permanent: never reorder or remove entries; append new game IDs only.
- Codes are validated for size, version, known IDs, complete choices, and matching release years. They are user-editable and do not certify authenticity.

## Catalogue and artwork

`data/games.json` contains 3,003 Wikipedia/Wikidata-sourced games from 1980–2025. It is a popular-title selection, not a sales ranking or every release ever made. Dates and artwork determine availability. Familiar games appear earlier; compilations and remasters appear later. `data/archive.json` retains retired entries so previous codes can still resolve them.

Artwork loads from Wikimedia, with title fallbacks if unavailable. Image source links are shown on the play screen. Internet access is needed for artwork. Genre totals describe saved games, not played time. Review source image licensing before commercial use.

## Checks

Node is needed only for development checks, not to play or deploy the site:

```sh
node --check assets/app.js
node tests/static.test.cjs
```



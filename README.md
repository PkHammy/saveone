# Save One

A Django game inspired by https://saveonegame.com/: save one game per release year, then share your collection with friends. Real API-sourced game artwork, expandable year lists, a responsive interface, keyboard choices, session-owned progress, public UUID result links, genre breakdowns, undo, dark mode, and downloadable collection posters.

## Run locally (uv only)

```powershell
uv sync --frozen
uv run manage.py migrate
uv run manage.py runserver
```

Open http://127.0.0.1:8000. Pick a year range, choose one title each year, and use **Share collection** on the result page. Refresh or return home to resume an unfinished run in the same browser. Starting another run replaces the home-page resume shortcut, but the previous play URL remains usable in its original browser session.

```powershell
uv run manage.py test
uv run manage.py check
```

## Public sharing / deployment

Localhost links only work on your own computer. Public links need this Django application hosted at a public HTTPS address and its database retained. No hosting account or domain is bundled with this project.

The Dockerfile runs Gunicorn with WhiteNoise for static files; it uses uv to install locked dependencies. Deploy it to a Docker-capable host with a persistent PostgreSQL database. Configure the variables in `.env.example` using your host's environment settings (the app does not automatically load `.env` files). Use a unique random `DJANGO_SECRET_KEY`, your real host in `DJANGO_ALLOWED_HOSTS`, the HTTPS origin in `DJANGO_CSRF_TRUSTED_ORIGINS`, and a persistent `DATABASE_URL`. Set `DJANGO_DEBUG=false`. Only set `DJANGO_TRUST_PROXY=true` behind a trusted proxy that strips incoming forwarding headers and sets `X-Forwarded-Proto` itself.

For a non-Docker Linux host:

```sh
uv sync --frozen --no-dev
uv run manage.py collectstatic --noinput
uv run manage.py migrate --noinput
uv run manage.py check --deploy
uv run gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
```

Terminate TLS at the host's reverse proxy. Keep a stable secret key and back up PostgreSQL. Docker startup applies migrations; use a dedicated release command instead if your host scales multiple app containers. SQLite is convenient locally, but a container's ephemeral filesystem loses collections on redeploy. Gunicorn runs on Linux; use Django runserver for local Windows development.

After deployment, complete a one-year run at your HTTPS domain, copy its `/r/<uuid>/` link, and open it from another device/incognito browser. Check that the result is visible, but the owner's `/play/<uuid>/` URL returns 404 in the other browser.

## Catalogue, image API, and genre meaning

`game/data/wikipedia_games.json` is a committed snapshot imported through the public Wikipedia and Wikidata APIs. The catalogue covers 1980 through 2025, with 48–86 available games per year. Major franchises are prioritised even when their Wikipedia articles are short, followed by article prominence. This is a popular-title selection, not a verified worldwide sales ranking. Games must appear in the corresponding Wikipedia release-year category and have the same earliest non-deprecated year-precision-or-better Wikidata publication date (`P577`). Later platform ports or rereleases cannot qualify a game for a later year. These are community-maintained sources, not an exhaustive commercial release database.

Game artwork loads from Wikimedia image URLs. Each game links to its article and image credit/licensing page. No API key is required, and the Django server does not call the upstream APIs during gameplay. Images are not bundled locally; a readable title-card fallback appears if a remote image fails. Images may be box art, arcade flyers, or game screenshots depending on the source. Check the linked image rights before using the project commercially.

To import the catalogue using uv:

```powershell
uv run python tools/import_wikipedia.py
```

The importer batches requests, retries rate limits, and checkpoints completed years in `.catalog-cache`. Rerunning resumes the import. To refresh cached data, rename `.catalog-cache` before rerunning. The final snapshot is only written after every year has at least 25 verified games with images; partial imports do not replace the working catalogue. Restart Django after updating the snapshot. Keep IDs stable for existing shared results. The original 135 records and previous API catalogue records are retained in the result lookup. Retired API records are stored in `game/data/archive_games.json`, so older share links remain valid.

The result reports **most saved genres**, not most played: no playtime is collected. Titles use one primary genre derived from Wikidata, with the original curated genres retained for matching legacy games; unknown genres appear as Other. Ties are displayed together.

Completed results and player names are public to anyone holding the URL. Unfinished runs are available only in the originating browser session. Typography uses local system fonts.

Deployment settings follow the Django checklist: https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

The expanded catalogue contains 3,003 verified API records across 1980–2025 (48–86 per year). The first 12 choices appear initially; “Show all available games” reveals the remaining catalogue entries. This is not an exhaustive list of every release: dates, artwork, and source coverage limit inclusion.

## Upload to GitHub

Upload the source folders (`config`, `game`, `tools`, `.github`) and root project files, including `uv.lock`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`, and the Dockerfile. Keep both catalogue JSON files and migrations. Local databases, environments, secrets, API caches, and generated files are excluded by `.gitignore`.

With Git installed, create an empty GitHub repository and run:

```sh
git init
git add .
git commit -m "Initial Save One app"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

GitHub Actions runs the Django checks and tests. Uploading this repository does not deploy the app: this remains a Django project; browser-only gameplay and import/export codes have not yet been implemented.

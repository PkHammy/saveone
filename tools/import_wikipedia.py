"""Refresh the committed, API-sourced catalogue; no API credentials required."""
import difflib
import hashlib
import json
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from game.catalog import LEGACY_GAMES as LEGACY

DEST = ROOT / 'game/data/wikipedia_games.json'
CACHE = ROOT / '.catalog-cache'
CACHE.mkdir(exist_ok=True)
LAST_REQUEST = 0.0

def api(host, **params):
    global LAST_REQUEST
    url = f'https://{host}/w/api.php?' + urlencode({'format': 'json', **params})
    for attempt in range(6):
        try:
            time.sleep(max(0, 1.5 - (time.monotonic() - LAST_REQUEST)))
            LAST_REQUEST = time.monotonic()
            req = Request(url, headers={'User-Agent': 'SaveOneCatalogue/1.0 (educational game history project)'})
            with urlopen(req, timeout=35) as response:
                data = json.load(response)
            if 'error' in data:
                raise RuntimeError(str(data['error']))
            return data
        except Exception as error:
            if attempt == 5:
                raise
            wait = min(45, 5 * 2 ** attempt)
            if isinstance(error, HTTPError) and error.code == 429:
                wait = min(60, max(wait, int(error.headers.get('Retry-After', '5'))))
            print(f'{host}: API retry after {wait}s ({type(error).__name__})', flush=True)
            time.sleep(wait)

def normal(title):
    title = re.sub(r'\s*\([^)]*\)', '', title)
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode().lower())

def cached(name, producer):
    path = CACHE / f'{name}.json'
    if path.exists():
        return json.loads(path.read_text(encoding='utf-8'))
    result = producer()
    path.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    return result

def pages_for(year):
    pages, continuation = {}, {}
    while True:
        data = api('en.wikipedia.org', action='query', generator='categorymembers',
                   gcmtitle=f'Category:{year} video games', gcmtype='page', gcmlimit=500,
                   prop='info|pageprops', ppprop='wikibase_item', **continuation)
        for key, page in data.get('query', {}).get('pages', {}).items():
            pages.setdefault(key, {}).update(page)
        continuation = data.get('continue')
        if not continuation:
            return list(pages.values())

def release_year(entity):
    claims = entity.get('claims', {}).get('P577', [])
    claims = [c for c in claims if c.get('rank') != 'deprecated']
    years = []
    for claim in claims:
        value = claim.get('mainsnak', {}).get('datavalue', {}).get('value', {})
        if value.get('precision', 0) >= 9:
            match = re.match(r'\+(\d{4})-', value.get('time', ''))
            if match:
                years.append(int(match[1]))
    return min(years) if years else None

def genre_for(labels):
    text = ' '.join(labels).lower()
    for pattern, genre in [(r'role.play|roguelike', 'RPG'), (r'racing|driving', 'Racing'),
                           (r'shooter|shoot.{0,3}em.{0,3}up', 'Shooter'), (r'fighting', 'Fighting'),
                           (r'platform', 'Platformer'), (r'horror', 'Horror'),
                           (r'puzzle', 'Puzzle'), (r'strategy|tactic|wargame|tower defense', 'Strategy'),
                           (r'sport|football|basketball|athletics', 'Sports'), (r'simulation', 'Simulation'),
                           (r'rhythm|music', 'Rhythm'), (r'educational|learning', 'Educational'),
                           (r'visual novel', 'Visual novel'), (r'adventure|interactive fiction|metroidvania', 'Adventure'),
                           (r'arcade|maze', 'Arcade'), (r'action|beat.{0,3}em.{0,3}up', 'Action'),
                           (r'virtual world', 'Sandbox'), (r'massively multiplayer', 'MMO'),
                           (r'survival', 'Survival'), (r'party|social deduction', 'Party'),
                           (r'augmented reality|location.based', 'Augmented reality'),
                           (r'hack and slash', 'Action')]:
        if re.search(pattern, text):
            return genre
    return 'Other'

def eligible(entity, year):
    instances = {c.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id')
                 for c in entity.get('claims', {}).get('P31', [])}
    # A film, a whole series, or an expansion is not a standalone game choice.
    return not instances.intersection({'Q11424', 'Q7058673', 'Q209163'}) and release_year(entity) == year

def import_year(year):
    pages = cached(f'pages-{year}', lambda: pages_for(year))
    pages = [p for p in pages if p.get('pageprops', {}).get('wikibase_item')]
    pages.sort(key=lambda p: p.get('length', 0), reverse=True)
    old = [g for g in LEGACY if g['year'] == year and not g['id'].startswith('wiki-')]
    matches = {}
    for game in old:
        target = normal(game['title'])
        candidates = sorted(pages, key=lambda p: difflib.SequenceMatcher(None, target, normal(p['title'])).ratio(), reverse=True)
        if candidates and difflib.SequenceMatcher(None, target, normal(candidates[0]['title'])).ratio() >= .87:
            matches[candidates[0]['pageid']] = game
    candidates = list({p['pageid']: p for p in pages[:45] + [p for p in pages if p['pageid'] in matches]}.values())
    entities = {}
    for offset in range(0, len(candidates), 50):
        batch = candidates[offset:offset + 50]
        ids = '|'.join(p['pageprops']['wikibase_item'] for p in batch)
        data = cached(f'entities-{year}-{offset}', lambda ids=ids: api('www.wikidata.org', action='wbgetentities', ids=ids, props='claims', languages='en'))
        entities.update(data.get('entities', {}))
    valid = [p for p in candidates if eligible(entities.get(p['pageprops']['wikibase_item'], {}), year)]
    valid.sort(key=lambda p: (p['pageid'] not in matches, -p.get('length', 0)))
    # Fetch images for more than the final quota, so missing artwork can be skipped.
    selected = valid[:45]
    image_data = cached(f'images-{year}', lambda: api('en.wikipedia.org', action='query', pageids='|'.join(str(p['pageid']) for p in selected), prop='pageimages', piprop='thumbnail|name', pilicense='any', pithumbsize=600)) if selected else {}
    images = image_data.get('query', {}).get('pages', {})
    genre_ids = set()
    for p in selected:
        for c in entities[p['pageprops']['wikibase_item']].get('claims', {}).get('P136', []):
            gid = c.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id')
            if gid:
                genre_ids.add(gid)
    label_path = CACHE / 'genre-labels.json'
    labels = json.loads(label_path.read_text(encoding='utf-8')) if label_path.exists() else {}
    genre_ids = sorted(genre_ids - set(labels))
    for offset in range(0, len(genre_ids), 50):
        ids = '|'.join(genre_ids[offset:offset + 50])
        data = api('www.wikidata.org', action='wbgetentities', ids=ids, props='labels', languages='en')
        labels.update({key: e.get('labels', {}).get('en', {}).get('value', '') for key, e in data.get('entities', {}).items()})
    label_path.write_text(json.dumps(labels), encoding='utf-8')
    result = []
    for page in selected:
        image = images.get(str(page['pageid']), {})
        cover = image.get('thumbnail', {}).get('source')
        if not cover:
            continue
        qid = page['pageprops']['wikibase_item']
        claims = entities[qid].get('claims', {}).get('P136', [])
        names = [labels.get(c.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id'), '') for c in claims]
        legacy = matches.get(page['pageid'])
        title = re.sub(r'\s*\((?:\d{4} )?(?:video game|arcade game)\)$', '', page['title'])
        result.append({'id': legacy['id'] if legacy else f'wiki-{page["pageid"]}',
                       'title': legacy['title'] if legacy else title, 'year': year,
                       'genre': legacy['genre'] if legacy else genre_for(names),
                       'cover_url': cover.split('?')[0],
                       'source_url': 'https://en.wikipedia.org/wiki/' + quote(page['title'].replace(' ', '_')),
                       'image_source_url': 'https://en.wikipedia.org/wiki/File:' + quote(image.get('pageimage', '').replace(' ', '_')),
                       'release_source_url': f'https://www.wikidata.org/wiki/{qid}#P577',
                       'verified_release_year': year})
        if len(result) == 12:
            break
    if len(result) < 10:
        raise RuntimeError(f'{year}: only {len(result)} verified games with images; refusing to publish incomplete year')
    return result

MAJOR_FRANCHISES = (
    'pokemon', 'mario', 'zelda', 'grandtheftauto', 'callofduty', 'halo',
    'finalfantasy', 'elderscrolls', 'fifa', 'easportsfc', 'proevolutionsoccer',
    'nba2k', 'madden', 'forza', 'granturismo', 'needforspeed', 'assassinscreed',
    'godofwar', 'sonic', 'residentevil', 'minecraft', 'reddead', 'animalcrossing',
    'monsterhunter', 'streetfighter', 'tekken', 'supersmash', 'diablo',
    'starcraft', 'warcraft', 'battlefield', 'mortalkombat', 'splatoon',
    'donkeykong', 'kirby', 'metroid', 'crashbandicoot', 'spyro', 'thesims',
    'pacman', 'tetris', 'dragonquest', 'metalgear', 'bioshock', 'darksouls',
    'bloodborne', 'eldenring', 'baldursgate', 'hogwartslegacy', 'cyberpunk',
    'uncharted', 'thelastofus', 'batmanarkham', 'gears', 'portal', 'halflife',
    'doom', 'apexlegends', 'counterstrike', 'fortnite', 'overwatch', 'destiny',
    'fallout', 'borderlands', 'witcher', 'rockstar', 'tombraider', 'farcry',
    'civilization', 'ageofempires', 'commandconquer', 'hitman', 'fireemblem',
    'stardewvalley', 'hollowknight', 'rocketleague', 'wii', 'justdance',
)

def major_title(title):
    name = normal(title)
    if name == 'dragonquestadventure' or ('doom' in name and not name.startswith('doom')):
        return False
    return any(fragment in name for fragment in MAJOR_FRANCHISES)

def digest(ids):
    return hashlib.sha256('|'.join(ids).encode()).hexdigest()[:16]

def main():
    years = list(range(1980, 2026))
    entities, images, labels = {}, {}, {}
    for path in CACHE.glob('entities-*.json'):
        entities.update(json.loads(path.read_text(encoding='utf-8')).get('entities', {}))
    for path in CACHE.glob('images-*.json'):
        images.update(json.loads(path.read_text(encoding='utf-8')).get('query', {}).get('pages', {}))
    for path in CACHE.glob('genres-*.json'):
        data = json.loads(path.read_text(encoding='utf-8'))
        labels.update({key: e.get('labels', {}).get('en', {}).get('value', '') for key, e in data.get('entities', {}).items()})
    label_path = CACHE / 'genre-labels.json'
    if label_path.exists():
        labels.update(json.loads(label_path.read_text(encoding='utf-8')))
    candidates_by_year, legacy_matches = {}, {}
    for year in years:
        pages = cached(f'pages-{year}', lambda year=year: pages_for(year))
        pages = [p for p in pages if p.get('pageprops', {}).get('wikibase_item')]
        pages.sort(key=lambda p: p.get('length', 0), reverse=True)
        matches = {}
        for game in [g for g in LEGACY if g['year'] == year]:
            target = normal(game['title'])
            ranked = sorted(pages, key=lambda p: difflib.SequenceMatcher(None, target, normal(p['title'])).ratio(), reverse=True)
            if ranked and difflib.SequenceMatcher(None, target, normal(ranked[0]['title'])).ratio() >= .87:
                matches[ranked[0]['pageid']] = game
        # Include major franchises even if their article is short; retain every
        # previously checked candidate so older small articles remain available.
        candidates = [p for p in pages if p in pages[:45] or major_title(p['title']) or p['pageid'] in matches or p['pageprops']['wikibase_item'] in entities]
        candidates_by_year[year] = candidates
        legacy_matches.update(matches)
    missing = sorted({p['pageprops']['wikibase_item'] for pages in candidates_by_year.values() for p in pages} - set(entities))
    print(f'Checking {len(missing)} additional major-title release records', flush=True)
    for offset in range(0, len(missing), 50):
        ids = missing[offset:offset + 50]
        data = cached('entities-extra-' + digest(ids), lambda ids=ids: api('www.wikidata.org', action='wbgetentities', ids='|'.join(ids), props='claims', languages='en'))
        entities.update(data.get('entities', {}))
    eligible_by_year = {year: [p for p in pages if eligible(entities.get(p['pageprops']['wikibase_item'], {}), year)] for year, pages in candidates_by_year.items()}
    missing_images = sorted({str(p['pageid']) for pages in eligible_by_year.values() for p in pages if str(p['pageid']) not in images})
    print(f'Fetching artwork for {len(missing_images)} additional games', flush=True)
    for offset in range(0, len(missing_images), 50):
        ids = missing_images[offset:offset + 50]
        data = cached('images-extra-' + digest(ids), lambda ids=ids: api('en.wikipedia.org', action='query', pageids='|'.join(ids), prop='pageimages', piprop='thumbnail|name', pilicense='any', pithumbsize=600))
        images.update(data.get('query', {}).get('pages', {}))
    genre_ids = set()
    for pages in eligible_by_year.values():
        for page in pages:
            for claim in entities[page['pageprops']['wikibase_item']].get('claims', {}).get('P136', []):
                gid = claim.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id')
                if gid:
                    genre_ids.add(gid)
    missing_genres = sorted(genre_ids - set(labels))
    for offset in range(0, len(missing_genres), 50):
        ids = missing_genres[offset:offset + 50]
        data = api('www.wikidata.org', action='wbgetentities', ids='|'.join(ids), props='labels', languages='en')
        labels.update({key: e.get('labels', {}).get('en', {}).get('value', '') for key, e in data.get('entities', {}).items()})
    label_path.write_text(json.dumps(labels), encoding='utf-8')
    all_games = []
    for year, pages in eligible_by_year.items():
        pages.sort(key=lambda p: (not major_title(p['title']), -p.get('length', 0)))
        games = []
        # Wikipedia combines these versions, but its linked entity describes
        # the 1998 international release. The Japanese originals have their
        # own dated Wikidata record and must appear in 1996.
        if year == 1996:
            variant = cached('entities-pokemon-variants', lambda: api('www.wikidata.org', action='wbgetentities', ids='Q91030617|Q1988120|Q837346', props='claims'))['entities']['Q91030617']
            if not eligible(variant, year):
                raise RuntimeError('Original Pokémon release date could not be verified')
            art = cached('pokemon-original-art', lambda: api('en.wikipedia.org', action='query', titles='File:Pokémon Red, Blue, and Yellow battle screenshot.png', prop='imageinfo', iiprop='url', iiurlwidth=600))
            info = next(iter(art['query']['pages'].values()))['imageinfo'][0]
            games.append({'id': 'wd-Q91030617', 'title': 'Pokémon Red and Green', 'year': year,
                          'genre': 'RPG', 'cover_url': info['url'].split('?')[0],
                          'source_url': 'https://www.pokemon.co.jp/game/other/gb-rg/',
                          'image_source_url': info['descriptionurl'],
                          'release_source_url': 'https://www.wikidata.org/wiki/Q91030617#P577',
                          'verified_release_year': year})
        for page in pages:
            if 'games from' in page['title'].lower() or page['title'].lower().startswith('list of '):
                continue
            image = images.get(str(page['pageid']), {})
            cover = image.get('thumbnail', {}).get('source')
            if not cover:
                continue
            qid = page['pageprops']['wikibase_item']
            claims = entities[qid].get('claims', {}).get('P136', [])
            genre = genre_for([labels.get(c.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id'), '') for c in claims])
            legacy = legacy_matches.get(page['pageid'])
            title = re.sub(r'\s*\((?:\d{4} )?(?:video game|arcade game)\)$', '', page['title'])
            games.append({'id': legacy['id'] if legacy else f'wiki-{page["pageid"]}',
                          'title': legacy['title'] if legacy else title, 'year': year,
                          'genre': legacy['genre'] if legacy else genre,
                          'cover_url': cover.split('?')[0],
                          'source_url': 'https://en.wikipedia.org/wiki/' + quote(page['title'].replace(' ', '_')),
                          'image_source_url': 'https://en.wikipedia.org/wiki/File:' + quote(image.get('pageimage', '').replace(' ', '_')),
                          'release_source_url': f'https://www.wikidata.org/wiki/{qid}#P577',
                          'verified_release_year': year})
        if len(games) < 25:
            raise RuntimeError(f'{year}: only {len(games)} verified games with artwork; no snapshot published')
        all_games.extend(games)
        print(f'{year}: {len(games)} games, including ' + ', '.join(g['title'] for g in games[:3]), flush=True)
    # Preserve retired records, including API IDs, for all existing shared results.
    archive_path = DEST.with_name('archive_games.json')
    archived = json.loads(archive_path.read_text(encoding='utf-8'))['games'] if archive_path.exists() else []
    previous = json.loads(DEST.read_text(encoding='utf-8'))['games'] if DEST.exists() else []
    archive = {g['id']: g for g in archived + previous}
    DEST.parent.mkdir(parents=True, exist_ok=True)
    archive_path.write_text(json.dumps({'games': list(archive.values())}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    payload = {'provider': 'Wikipedia / Wikidata', 'selection': 'Major franchises first, then article prominence; not a sales ranking', 'imported_at': datetime.now(timezone.utc).isoformat(), 'games': all_games}
    DEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Published {len(all_games)} games to {DEST}', flush=True)

if __name__ == '__main__':
    main()

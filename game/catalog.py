"""API-sourced games and remote images, checked against earliest Wikidata release years.
A committed snapshot keeps game rounds fast and available during API outages.
Legacy records remain available for previously saved collections.
"""
import json
from pathlib import Path
from django.utils.text import slugify
DATA = """
1980|Pac-Man:Arcade|Missile Command:Shooter|Battlezone:Shooter
1981|Donkey Kong:Platformer|Galaga:Shooter|Frogger:Arcade
1982|Dig Dug:Arcade|Pitfall!:Platformer|River Raid:Shooter
1983|Mario Bros.:Platformer|Bomberman:Arcade|Dragon's Lair:Adventure
1984|Tetris:Puzzle|Excitebike:Racing|Duck Hunt:Shooter
1985|Super Mario Bros.:Platformer|Space Harrier:Shooter|Ghosts 'n Goblins:Platformer
1986|The Legend of Zelda:Adventure|Metroid:Adventure|Out Run:Racing
1987|Final Fantasy:RPG|Street Fighter:Fighting|Metal Gear:Action
1988|Mega Man 2:Platformer|Ninja Gaiden:Action|Super Mario Bros. 3:Platformer
1989|SimCity:Simulation|Prince of Persia:Platformer|Mother:RPG
1990|Super Mario World:Platformer|F-Zero:Racing|The Secret of Monkey Island:Adventure
1991|Sonic the Hedgehog:Platformer|Street Fighter II:Fighting|Civilization:Strategy
1992|Super Mario Kart:Racing|Mortal Kombat:Fighting|Wolfenstein 3D:Shooter
1993|Doom:Shooter|Star Fox:Shooter|The Legend of Zelda - Link's Awakening:Adventure
1994|Super Metroid:Adventure|Final Fantasy VI:RPG|Donkey Kong Country:Platformer
1995|Chrono Trigger:RPG|Tekken 2:Fighting|Command & Conquer:Strategy
1996|Super Mario 64:Platformer|Quake:Shooter|Pokemon Red and Green:RPG
1997|Final Fantasy VII:RPG|GoldenEye 007:Shooter|Gran Turismo:Racing
1998|Half-Life:Shooter|The Legend of Zelda - Ocarina of Time:Adventure|StarCraft:Strategy
1999|Tony Hawk's Pro Skater:Sports|Age of Empires II:Strategy|Silent Hill:Horror
2000|The Sims:Simulation|Deus Ex:RPG|Diablo II:RPG
2001|Halo - Combat Evolved:Shooter|Grand Theft Auto III:Action|Final Fantasy X:RPG
2002|Metroid Prime:Adventure|The Elder Scrolls III - Morrowind:RPG|Need for Speed - Hot Pursuit 2:Racing
2003|Star Wars - Knights of the Old Republic:RPG|Call of Duty:Shooter|Need for Speed - Underground:Racing
2004|Half-Life 2:Shooter|World of Warcraft:RPG|Grand Theft Auto - San Andreas:Action
2005|Resident Evil 4:Horror|God of War:Action|Forza Motorsport:Racing
2006|Gears of War:Shooter|The Elder Scrolls IV - Oblivion:RPG|Wii Sports:Sports
2007|BioShock:Shooter|Portal:Puzzle|Mass Effect:RPG
2008|Fallout 3:RPG|Mario Kart Wii:Racing|Dead Space:Horror
2009|Uncharted 2 - Among Thieves:Adventure|Borderlands:Shooter|League of Legends:Strategy
2010|Red Dead Redemption:Action|Mass Effect 2:RPG|Super Meat Boy:Platformer
2011|Minecraft:Sandbox|The Elder Scrolls V - Skyrim:RPG|Dark Souls:RPG
2012|Journey:Adventure|Dishonored:Action|Forza Horizon:Racing
2013|The Last of Us:Adventure|Grand Theft Auto V:Action|Dota 2:Strategy
2014|Dragon Age - Inquisition:RPG|Mario Kart 8:Racing|Alien - Isolation:Horror
2015|The Witcher 3 - Wild Hunt:RPG|Rocket League:Sports|Bloodborne:RPG
2016|Overwatch:Shooter|Stardew Valley:Simulation|DOOM:Shooter
2017|The Legend of Zelda - Breath of the Wild:Adventure|Hollow Knight:Platformer|Persona 5:RPG
2018|Red Dead Redemption 2:Action|God of War:Action|Celeste:Platformer
2019|Sekiro - Shadows Die Twice:Action|Disco Elysium:RPG|Apex Legends:Shooter
2020|Hades:Action|Animal Crossing - New Horizons:Simulation|Doom Eternal:Shooter
2021|It Takes Two:Platformer|Forza Horizon 5:Racing|Resident Evil Village:Horror
2022|Elden Ring:RPG|God of War Ragnarok:Action|Stray:Adventure
2023|Baldur's Gate 3:RPG|The Legend of Zelda - Tears of the Kingdom:Adventure|Alan Wake 2:Horror
2024|Balatro:Puzzle|Black Myth - Wukong:Action|Astro Bot:Platformer
"""
# Persona 5 first launched in Japan in 2016.
DATA = DATA.replace('2017|The Legend of Zelda - Breath of the Wild:Adventure|Hollow Knight:Platformer|Persona 5:RPG', '2017|The Legend of Zelda - Breath of the Wild:Adventure|Hollow Knight:Platformer|Divinity - Original Sin 2:RPG')
ICONS = {'RPG': '✦', 'Shooter': '⊕', 'Racing': '↗', 'Platformer': '▦', 'Adventure': '◈', 'Action': 'ϟ', 'Arcade': '●', 'Puzzle': '▧', 'Fighting': '⚔', 'Strategy': '♜', 'Simulation': '⌂', 'Sports': '◎', 'Horror': '☽', 'Sandbox': '▣'}
GAMES = []
for line in DATA.strip().splitlines():
    year, *titles = line.split('|')
    for index, item in enumerate(titles):
        title, genre = item.rsplit(':', 1)
        GAMES.append({'id': f'{year}-{slugify(title)}', 'title': title.replace(' - ', ': '), 'year': int(year), 'genre': genre, 'icon': ICONS[genre], 'color': (int(year) * 41 + index * 113) % 360})
LEGACY_GAMES = GAMES
snapshot = Path(__file__).parent / 'data' / 'wikipedia_games.json'
if snapshot.exists():
    GAMES = json.loads(snapshot.read_text(encoding='utf-8'))['games']
    for index, game in enumerate(GAMES):
        game['icon'] = ICONS.get(game['genre'], '◇')
        game['color'] = (game['year'] * 41 + index * 113) % 360
archive = Path(__file__).parent / 'data' / 'archive_games.json'
ARCHIVED_GAMES = json.loads(archive.read_text(encoding='utf-8'))['games'] if archive.exists() else []
for index, game in enumerate(ARCHIVED_GAMES):
    game['icon'] = ICONS.get(game['genre'], '◇')
    game['color'] = (game['year'] * 41 + index * 113) % 360
# Keep the original records resolvable for already completed/shared collections.
BY_ID = {g['id']: g for g in LEGACY_GAMES}
BY_ID.update({g['id']: g for g in ARCHIVED_GAMES})
BY_ID.update({g['id']: g for g in GAMES})
YEARS = sorted({g['year'] for g in GAMES})
def games_for(year):
    import re
    legacy = {g['id'] for g in LEGACY_GAMES}
    def priority(game):
        title = game['title'].lower()
        secondary = bool(re.search(r'collection|compilation|remaster|trilogy|game & watch|cement factory|jr\. math', title))
        return (secondary, game['id'] not in legacy)
    return sorted([g for g in GAMES if g['year'] == year], key=priority)

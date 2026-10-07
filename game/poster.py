"""Create a portable collection poster without fetching third-party artwork."""
from collections import Counter
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def font(size):
    for path in ('C:/Windows/Fonts/arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def make_poster(run, games):
    width = 1200
    image = Image.new('RGB', (width, 360 + ((len(games) + 1) // 2) * 130), '#171b19')
    draw = ImageDraw.Draw(image)
    heading, body, small = font(44), font(23), font(19)
    draw.text((50, 35), 'SAVE ONE', font=body, fill='#89c5a6')
    name = run.nickname
    while draw.textlength(name + "'s collection", font=heading) > 1100:
        name = name[:-2]
    draw.text((50, 90), name + "'s collection", font=heading, fill='#edf1ec')
    draw.text((50, 157), f'{run.years[0]}–{run.years[-1]} · {len(games)} games', font=body, fill='#a6b0a8')
    genres = Counter(g['genre'] for g in games).most_common(3)
    draw.text((50, 210), 'Top genres: ' + ' · '.join(f'{g} ({n})' for g, n in genres), font=small, fill='#89c5a6')
    for index, game in enumerate(games):
        x, y = 50 + (index % 2) * 560, 285 + (index // 2) * 130
        draw.rounded_rectangle((x, y, x + 540, y + 114), radius=8, fill='#202622')
        draw.text((x + 18, y + 12), f'{game["year"]} · {game["genre"]}', font=small, fill='#89c5a6')
        words, lines, line = game['title'].split(), [], ''
        for word in words:
            proposed = (line + ' ' + word).strip()
            if line and draw.textlength(proposed, font=body) > 502:
                lines.append(line)
                line = word
            else:
                line = proposed
        lines.append(line)
        for offset, text in enumerate(lines[:2]):
            if offset == 1 and len(lines) > 2:
                text += '…'
            while draw.textlength(text, font=body) > 502:
                text = text[:-2] + '…'
            draw.text((x + 18, y + 42 + offset * 28), text, font=body, fill='#edf1ec')
    draw.text((50, image.height - 40), 'One year. One favourite.', font=small, fill='#a6b0a8')
    output = BytesIO()
    image.save(output, format='PNG')
    return output.getvalue()

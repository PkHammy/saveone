import { byId, stats } from './catalogue.js';

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

export { poster };

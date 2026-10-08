import { byId, years, yearIds, yearIndex } from './catalogue.js';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const maxCodeLength = 300;
function ranges() {
  const available = Object.keys(yearIds)
    .map(Number)
    .sort((a, b) => a - b);
  return available.flatMap((first, index) => available.slice(index).map((last) => [first, last]));
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
  validate(value, true);
  const nameBytes = new TextEncoder().encode(value.name);
  let number = value.name === 'Player' ? 0n : 1n;
  if (number)
    nameBytes.forEach((byte) => {
      number = number * 256n + BigInt(byte);
    });
  for (let index = value.picks.length - 1; index >= 0; index--) {
    const entries = yearIds[value.years[index]];
    const pick = yearIndex.get(value.picks[index]);
    if (pick === undefined || entries?.[pick] !== value.picks[index])
      throw Error('Game has no share number.');
    number = number * BigInt(entries.length) + BigInt(pick);
  }
  const yearRanges = ranges();
  const range = yearRanges.findIndex(
    ([first, last]) => first === value.years[0] && last === value.years.at(-1),
  );
  if (range === -1) throw Error('Invalid collection years.');
  number = number * BigInt(yearRanges.length) + BigInt(range);
  let code = '';
  do {
    code = alphabet[Number(number % 64n)] + code;
    number /= 64n;
  } while (number);
  return 'S' + code;
}
function decode(code) {
  code = code.trim();
  if (code.startsWith('http'))
    code = new URLSearchParams(new URL(code).hash.slice(1)).get('collection') || '';
  if (
    !/^S[A-Za-z0-9_-]+$/.test(code) ||
    code.length > maxCodeLength ||
    (code.length > 2 && code[1] === 'A')
  )
    throw Error('Paste a valid collection code or link.');
  let number = 0n;
  for (const char of code.slice(1)) number = number * 64n + BigInt(alphabet.indexOf(char));
  const yearRanges = ranges();
  const [first, last] = yearRanges[Number(number % BigInt(yearRanges.length))];
  number /= BigInt(yearRanges.length);
  const pickedYears = Array.from({ length: last - first + 1 }, (_, index) => first + index);
  const picks = pickedYears.map((year) => {
    const entries = yearIds[year];
    const id = entries[Number(number % BigInt(entries.length))];
    number /= BigInt(entries.length);
    return id;
  });
  let name = 'Player';
  if (number) {
    const bytes = [];
    while (number > 1n && bytes.length <= 160) {
      bytes.unshift(Number(number % 256n));
      number /= 256n;
    }
    if (number !== 1n || bytes.length > 160) throw Error('Invalid collection name.');
    name = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
  }
  const value = validate({ v: 1, name, years: pickedYears, picks }, true);
  if (encode(value) !== code) throw Error('Invalid collection code.');
  return value;
}
export { validate, encode, decode };

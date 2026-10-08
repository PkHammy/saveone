import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as catalogue from '../src/lib/catalogue.js';
import { encode, decode, validate } from '../src/lib/sharing.js';
import { shufflePicks, tournamentRound, tournamentBracket } from '../src/lib/tournament.js';
import { findSavedTournament } from '../src/lib/storage.js';

const catalog = JSON.parse(fs.readFileSync('data/games.json')).games;
const archive = JSON.parse(fs.readFileSync('data/archive.json')).games;
const manifest = JSON.parse(fs.readFileSync('data/share-years.json'));
assert.equal(
  createHash('sha256').update(fs.readFileSync('data/share-years.json')).digest('hex'),
  '70ae9d0dfaef047a2069799fdf91f979b0082da83ba67ab792d62b29859e3b55',
  'The compact-code manifest must remain frozen.',
);
catalogue.initialize(catalog, archive, manifest);
const value = {
  v: 1,
  name: 'Player',
  years: catalogue.years,
  picks: catalogue.years.map((y) => catalogue.order(y)[0].id),
};
assert.ok(encode(value).length < 60);
assert.deepEqual(decode(encode(value)), value);
assert.deepEqual(decode('https://example.com/saveone/#collection=' + encode(value)), value);
for (const code of [
  '',
  'SO1.abc',
  'SO2.abc',
  'SO3.abc',
  'SO4.abc',
  'S!',
  'SA' + encode(value).slice(1),
  'S' + 'z'.repeat(301),
])
  assert.throws(() => decode(code));
for (const invalid of [
  { ...value, v: 2 },
  { ...value, picks: [] },
  { ...value, name: 'a'.repeat(41) },
  { ...value, years: [2025, 2024] },
  { ...value, years: [2025], picks: [value.picks[0]] },
  { ...value, picks: ['missing'] },
])
  assert.throws(() => validate(invalid, true));
for (const name of ['Player', '', 'Hammy', '玩家 🎮', '😀'.repeat(20), 'a'.repeat(40)])
  for (const size of [1, 2, 7, 8, 9, 46]) {
    const sample = {
      ...value,
      name,
      years: value.years.slice(0, size),
      picks: value.picks.slice(0, size),
    };
    assert.deepEqual(decode(encode(sample)), sample);
  }
for (let start = 0; start < value.years.length; start++)
  for (let end = start; end < value.years.length; end++) {
    const sample = {
      ...value,
      years: value.years.slice(start, end + 1),
      picks: value.picks.slice(start, end + 1),
    };
    assert.deepEqual(decode(encode(sample)), sample);
  }
for (const game of catalogue.byId.values()) {
  const sample = { v: 1, name: 'Player', years: [game.year], picks: [game.id] };
  assert.equal(manifest[game.year][catalogue.yearIndex.get(game.id)], game.id);
  assert.deepEqual(decode(encode(sample)), sample);
}
for (const size of [1, 2, 3, 5, 12, 25, 46]) {
  const order = shufflePicks(value.picks.slice(0, size));
  assert.equal(new Set(order).size, size);
  const state = { order, choices: [] };
  while (tournamentRound(state).contenders.length > 1) {
    const current = tournamentRound(state);
    state.choices.push(current.contenders[current.match]);
  }
  assert.equal(state.choices.length, size - 1);
  assert.ok(order.includes(tournamentBracket(state).champion));
  if (size > 1) {
    state.choices.pop();
    assert.equal(tournamentRound(state).contenders.length, 2);
  }
}
assert.throws(() => tournamentRound({ order: value.picks.slice(0, 3), choices: ['invalid'] }));
const stored = { order: [...value.picks], choices: [] };
globalThis.localStorage = {
  'save-one-tournament-old': JSON.stringify(stored),
  getItem(key) {
    return this[key] || null;
  },
};
assert.deepEqual(findSavedTournament(value), stored);
console.log(
  'Collection validation, all year ranges, all games, Unicode, tournament and saved-progress checks passed.',
);
console.log('Full 46-year Player collection: ' + encode(value).length + ' characters.');

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const catalog = JSON.parse(fs.readFileSync('data/games.json')).games;
const archive = JSON.parse(fs.readFileSync('data/archive.json')).games;
const context = vm.createContext({
  TextEncoder,
  TextDecoder,
  URL,
  URLSearchParams,
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  document: { querySelector: () => ({}), addEventListener: () => {} },
  fetch: () => new Promise(() => {}),
});
vm.runInContext(fs.readFileSync('assets/app.js', 'utf8'), context);
context.catalog = catalog;
context.archive = archive;
context.ids = JSON.parse(fs.readFileSync('data/share-ids.json'));
vm.runInContext(
  'shareIds=ids;shareIndex=new Map(ids.map((id,index)=>[id,index]));games=catalog;byId=new Map([...archive,...games].map(g=>[g.id,g]));years=[...new Set(games.map(g=>g.year))].sort((a,b)=>a-b)',
  context,
);
const evalJS = (s) => vm.runInContext(s, context);
const value = evalJS("({v:1,name:'玩家 🎮',years:years,picks:years.map(y=>order(y)[0].id)})");
context.value = value;
assert.equal(evalJS('decode(encode(value)).name'), value.name);
assert.equal(evalJS('decode(encode(value)).picks.length'), 46);
assert.equal(
  evalJS("decode('https://example.com/repo/#collection='+encode(value)).picks.length"),
  46,
);
assert.throws(() => evalJS("decode('not-a-code')"));
assert.throws(() => evalJS('validate({...value,v:2},true)'));
assert.throws(() => evalJS("validate({...value,picks:['missing-id']},true)"));
assert.throws(() => evalJS('validate({...value,picks:[]},true)'));
assert.throws(() => evalJS('validate({...value,years:[2025,2024]},true)'));
assert.throws(() => evalJS('validate({...value,years:[2025],picks:[order(1980)[0].id]},true)'));
assert.equal(evalJS("escapeHTML('<img onerror=alert(1)>')"), '&lt;img onerror=alert(1)&gt;');
assert.equal(evalJS("safeURL('javascript:alert(1)')"), '#');
assert.ok(evalJS("order(2021).findIndex(g=>g.title.includes('The Trilogy'))") > 11);
assert.equal(evalJS('stats(value).reduce((sum,row)=>sum+row[1],0)'), 46);
assert.ok(evalJS('encode(value).length') < 200);
assert.equal(
  evalJS(
    "decode('SO1.'+btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'' )).picks.length",
  ),
  46,
);
const oldIds = [...context.ids];
context.ids.push('future-game');
assert.equal(evalJS('decode(encode(value)).picks.length'), 46);
assert.deepEqual(context.ids.slice(0, oldIds.length), oldIds);
assert.throws(() => evalJS('decode(encode(value).slice(0,-4))'));
console.log('Compact-code and legacy compatibility checks passed.');
console.log('46-year Unicode collection: ' + evalJS('encode(value).length') + ' characters.');

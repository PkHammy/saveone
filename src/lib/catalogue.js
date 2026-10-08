let games, byId, years, yearIds, yearIndex;
function order(year) {
  const preferred =
    /^(pac-man$|adventure$|donkey kong$|galaga$|super mario|sonic the hedgehog|the legend of zelda|pokémon (red|gold|ruby|diamond|x |sun|sword|scarlet|legends)|grand theft auto|half-life|doom$|resident evil 4$|minecraft$|elden ring$|baldur.s gate 3|the witcher 3|red dead redemption|the last of us|final fantasy|metal gear solid|street fighter ii$)/i;
  const secondary =
    /collection|compilation|remaster|trilogy|game & watch|cement factory|jr\. math/i;
  return games
    .filter((g) => g.year === year)
    .sort(
      (a, b) =>
        Number(secondary.test(a.title)) - Number(secondary.test(b.title)) ||
        Number(preferred.test(b.title)) - Number(preferred.test(a.title)),
    );
}
function stats(value) {
  const counts = new Map();
  value.picks.forEach((id) => {
    const genre = byId.get(id).genre;
    counts.set(genre, (counts.get(genre) || 0) + 1);
  });
  return [...counts].sort((a, b) => b[1] - a[1]);
}
function initialize(catalog, archive, perYear) {
  games = catalog;
  byId = new Map([...archive, ...catalog].map((g) => [g.id, g]));
  years = [...new Set(games.map((g) => g.year))].sort((a, b) => a - b);
  yearIds = perYear;
  yearIndex = new Map(
    Object.values(perYear).flatMap((entries) => entries.map((id, index) => [id, index])),
  );
}

export { initialize, games, byId, years, yearIds, yearIndex, order, stats };

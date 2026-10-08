function shufflePicks(picks) {
  const shuffled = [...picks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const range = i + 1;
    const limit = Math.floor(4294967296 / range) * range;
    let number;
    do {
      number = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (number >= limit);
    const j = number % range;
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function tournamentBracket(state) {
  let entrants = state.order.map((id) => ({ id, source: '' }));
  const rounds = [];
  let choice = 0;
  while (entrants.length > 1) {
    const matches = [],
      next = [];
    for (let i = 0; i < entrants.length; i += 2) {
      const pair = entrants.slice(i, i + 2);
      const bye = pair.length === 1;
      let winner = null;
      if (bye) winner = pair[0].id;
      else if (pair.every((entry) => entry.id) && choice < state.choices.length) {
        winner = state.choices[choice++];
        if (!pair.some((entry) => entry.id === winner)) throw Error('Invalid tournament progress.');
      }
      matches.push({ pair, winner, bye });
      next.push({ id: winner, source: 'Winner of match ' + matches.length });
    }
    rounds.push(matches);
    entrants = next;
  }
  if (choice !== state.choices.length) throw Error('Invalid tournament progress.');
  return { rounds, champion: entrants[0]?.id };
}
function tournamentRound(state) {
  const bracket = tournamentBracket(state);
  for (let index = 0; index < bracket.rounds.length; index++) {
    const matches = bracket.rounds[index];
    const pending = matches.findIndex((match) => !match.bye && !match.winner);
    if (pending !== -1) {
      return {
        contenders: matches.flatMap((match) => match.pair.map((entry) => entry.id)),
        round: index + 1,
        match: pending * 2,
      };
    }
  }
  return { contenders: [bracket.champion], round: bracket.rounds.length + 1, match: 0 };
}

export { shufflePicks, tournamentBracket, tournamentRound };

import { useState } from 'react';
import { encode } from '../lib/sharing.js';
import { read, store, findSavedTournament } from '../lib/storage.js';
import { tournamentBracket, tournamentRound, shufflePicks } from '../lib/tournament.js';
export default function useTournament(collection) {
  const key = 'save-one-tournament-' + encode(collection);
  const [state, setState] = useState(() => {
    const saved = read(key) || findSavedTournament(collection);
    try {
      if (
        saved &&
        Array.isArray(saved.order) &&
        Array.isArray(saved.choices) &&
        saved.order.length === collection.picks.length &&
        new Set(saved.order).size === collection.picks.length &&
        saved.order.every((id) => collection.picks.includes(id)) &&
        saved.choices.length < collection.picks.length
      ) {
        tournamentBracket(saved);
        return saved;
      }
    } catch {}
    return null;
  });
  const [saved, setSaved] = useState(true);
  const update = (next) => {
    setState(next);
    setSaved(store(key, next));
  };
  const restart = () => update({ order: shufflePicks(collection.picks), choices: [] });
  const pick = (id) => {
    const current = tournamentRound(state);
    if (
      current.contenders.length < 2 ||
      !current.contenders.slice(current.match, current.match + 2).includes(id)
    )
      return;
    update({ ...state, choices: [...state.choices, id] });
  };
  const undo = () => {
    if (state?.choices.length) update({ ...state, choices: state.choices.slice(0, -1) });
  };
  return {
    state,
    saved,
    restart,
    pick,
    undo,
    bracket: state && tournamentBracket(state),
    current: state && tournamentRound(state),
  };
}

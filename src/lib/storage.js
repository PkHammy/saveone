const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};
const store = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

function findSavedTournament(collection) {
  try {
    const keys = Object.keys(localStorage)
      .filter((key) => key.startsWith('save-one-tournament-'))
      .sort()
      .reverse();
    for (const key of keys) {
      const saved = read(key);
      if (
        Array.isArray(saved?.order) &&
        saved.order.length === collection.picks.length &&
        new Set(saved.order).size === collection.picks.length &&
        saved.order.every((id) => collection.picks.includes(id))
      )
        return saved;
    }
  } catch {}
  return null;
}
export { read, store, findSavedTournament };

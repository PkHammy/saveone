import { useState } from 'react';
import { validate } from '../lib/sharing.js';
import { read, store } from '../lib/storage.js';
export default function useCollection() {
  const [run, setRun] = useState(() => {
    try {
      const saved = read('save-one-run');
      return saved ? validate(saved) : null;
    } catch {
      return null;
    }
  });
  const [storageError, setStorageError] = useState(false);
  const update = (value) => {
    setRun(value);
    setStorageError(!store('save-one-run', value));
  };
  const undo = () => {
    if (!run?.picks.length) return;
    update({ ...run, picks: run.picks.slice(0, -1) });
    location.hash = '#play';
  };
  const start = (value) => {
    update(value);
    location.hash = '#play';
  };
  return { run, update, undo, start, storageError };
}

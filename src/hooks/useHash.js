import { useEffect, useState } from 'react';

export default function useHash() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const listener = () => setHash(location.hash);
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  return hash;
}

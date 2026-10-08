import { useEffect, useState } from 'react';

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return (
        localStorage.getItem('save-one-theme') ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      );
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === 'dark' ? '#0c110e' : '#f6f7f3';
    try {
      localStorage.setItem('save-one-theme', theme);
    } catch {}
  }, [theme]);
  return [theme, setTheme];
}

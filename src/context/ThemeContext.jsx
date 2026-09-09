import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return (
      localStorage.getItem('pihound_theme') ||
      localStorage.getItem('picrumbs_theme') ||
      'dark'
    );
  });

  const setTheme = (mode) => {
    const isLight = mode === 'light';
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    localStorage.setItem('pihound_theme', mode);
    localStorage.setItem('picrumbs_theme', mode);
    setThemeState(mode);
  };

  useEffect(() => {
    const current =
      localStorage.getItem('pihound_theme') ||
      localStorage.getItem('picrumbs_theme') ||
      'dark';
    setTheme(current);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

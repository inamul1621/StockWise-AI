import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('stockwise-theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') return saved;
      return 'light'; // Default to clean light mode
    } catch {
      return 'light';
    }
  });

  const applyThemeToDOM = (activeTheme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    if (activeTheme === 'dark') {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('stockwise-theme', theme);
    } catch {}
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    // Immediately apply to DOM for instant visual response
    applyThemeToDOM(newTheme);
    try {
      localStorage.setItem('stockwise-theme', newTheme);
    } catch {}
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

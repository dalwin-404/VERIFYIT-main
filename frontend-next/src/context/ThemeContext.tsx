'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'dark' | 'light' | 'ocean' | 'forest';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('verifyit-theme') as ThemeType;
    const initialTheme = savedTheme || 'dark';
    setThemeState(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('verifyit-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

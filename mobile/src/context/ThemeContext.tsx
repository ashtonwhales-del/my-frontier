import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightPalette, DarkPalette, AppPalette } from '../theme/colors';

type ThemeMode = 'light' | 'dark' | 'system';
const STORAGE_KEY = '@myfrontier/theme-mode';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => Promise<void>;
  palette: AppPalette;
  colors: AppPalette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [systemIsDark, setSystemIsDark] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'light' || val === 'dark' || val === 'system') setModeState(val);
    });
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemIsDark(colorScheme === 'dark');
    });
    return () => sub.remove();
  }, []);

  const setMode = async (m: ThemeMode) => {
    setModeState(m);
    await AsyncStorage.setItem(STORAGE_KEY, m);
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark);
  const palette = isDark ? DarkPalette : LightPalette;

  return (
    <ThemeContext.Provider value={{ mode, setMode, palette, colors: palette, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

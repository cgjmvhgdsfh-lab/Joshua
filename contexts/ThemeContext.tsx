import React, { createContext, useState, useEffect, useContext, FC, ReactNode } from 'react';

type Theme = 'light' | 'dark';
export type AppFont = 'sans' | 'serif' | 'mono' | 'lora' | 'fira-code' | 'poppins' | 'montserrat' | 'playfair' | 'jetbrains-mono' | 'nunito' | 'merriweather' | 'inconsolata' | 'lato' | 'oswald' | 'roboto-mono';
export type AppBackground = 'universum' | 'neural' | 'cosmic' | 'plain' | 'geometric' | 'starfield' | 'gradient-wave' | 'hexagon' | 'bubbles' | 'noise' | 'topo' | 'blueprint' | 'aurora' | 'circuit' | 'wavy-grid' | 'polka-dots' | 'digital-rain' | 'tetris-fall';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  font: AppFont;
  setFont: (font: AppFont) => void;
  background: AppBackground;
  setBackground: (background: AppBackground) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: FC<{children: ReactNode}> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [font, setFont] = useState<AppFont>('sans');
  const [background, setBackground] = useState<AppBackground>('universum');

  // Initialization effect
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

    const storedFont = localStorage.getItem('app-font') as AppFont | null;
    setFont(storedFont || 'sans');

    const storedBackground = localStorage.getItem('app-background') as AppBackground | null;
    setBackground(storedBackground || 'universum');
  }, []);
  
  // Effect to apply classes and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    // Theme
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    
    // Font
    const fontClasses: `font-${AppFont}`[] = ['font-sans', 'font-serif', 'font-mono', 'font-lora', 'font-fira-code', 'font-poppins', 'font-montserrat', 'font-playfair', 'font-jetbrains-mono', 'font-nunito', 'font-merriweather', 'font-inconsolata', 'font-lato', 'font-oswald', 'font-roboto-mono'];
    body.classList.remove(...fontClasses);
    body.classList.add(`font-${font}`);
    localStorage.setItem('app-font', font);
        
    // Background
    const bgClasses: `bg-${AppBackground}`[] = ['bg-universum', 'bg-neural', 'bg-cosmic', 'bg-plain', 'bg-geometric', 'bg-starfield', 'bg-gradient-wave', 'bg-hexagon', 'bg-bubbles', 'bg-noise', 'bg-topo', 'bg-blueprint', 'bg-aurora', 'bg-circuit', 'bg-wavy-grid', 'bg-polka-dots', 'bg-digital-rain', 'bg-tetris-fall'];
    body.classList.remove(...bgClasses);
    body.classList.add(`bg-${background}`);
    localStorage.setItem('app-background', background);

  }, [theme, font, background]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, font, setFont, background, setBackground }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
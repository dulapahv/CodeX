/**
 * Editor theme utility that manages Monaco editor themes.
 * Features:
 * - Theme initialization and persistence
 * - Theme application to editor and UI
 * - CSS variable handling for consistent theming
 * - System/dark mode synchronization
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from '@monaco-editor/react';
import themeList from 'monaco-themes/themes/themelist.json';

const DEFAULT_THEMES = {
  'vs-dark': {
    name: 'Dark (Visual Studio)',
    variables: {
      '--toolbar-bg-secondary': '#3c3c3c',
      '--panel-background': '#1e1e1e',
      '--toolbar-foreground': '#fff',
      '--toolbar-bg-primary': '#2678ca',
      '--toolbar-accent': '#2678ca',
      '--panel-text-accent': '#fff',
    },
  },
  light: {
    name: 'Light (Visual Studio)',
    variables: {
      '--toolbar-bg-secondary': '#dddddd',
      '--panel-background': '#fffffe',
      '--toolbar-foreground': '#000',
      '--toolbar-bg-primary': '#2678ca',
      '--toolbar-accent': '#2678ca',
      '--panel-text-accent': '#fff',
    },
  },
};

const setCSSVariables = (variables: Record<string, string>) => {
  if (typeof document === 'undefined') return; // Check for SSR

  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

// Global Monaco instance reference
let globalMonaco: Monaco | null = null;

// Function to register Monaco

export const registerMonaco = (monaco: Monaco) => {
  globalMonaco = monaco;

  // Apply the current theme to Monaco if it exists
  const savedTheme =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('editorTheme')
      : null;
  if (savedTheme && globalMonaco) {
    globalMonaco.editor.setTheme(savedTheme);
  }
};

export const initEditorTheme = () => {
  if (typeof window === 'undefined') return; // Skip during SSR

  const savedTheme = localStorage.getItem('editorTheme');

  if (savedTheme) {
    // Apply theme variables
    if (savedTheme in DEFAULT_THEMES) {
      // For default themes
      const themeConfig =
        DEFAULT_THEMES[savedTheme as keyof typeof DEFAULT_THEMES];
      setCSSVariables(themeConfig.variables);
      setCSSVariables({ '--status-bar-text': '#fff' });

      // Set document classes for dark mode
      if (savedTheme === 'vs-dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } else {
      // For custom themes
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const themeData = require(
          `monaco-themes/themes/${themeList[savedTheme as keyof typeof themeList]}.json`,
        );

        // Set document classes for dark mode
        if (themeData.base === 'vs-dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }

        setCSSVariables({
          '--toolbar-bg-primary': themeData.colors[
            'editor.selectionBackground'
          ].slice(0, 7),
          '--toolbar-bg-secondary': themeData.colors[
            'editor.selectionBackground'
          ].slice(0, 7),
          '--toolbar-foreground': themeData.colors['editor.foreground'].slice(
            0,
            7,
          ),
          '--toolbar-accent': themeData.colors['editorCursor.foreground'].slice(
            0,
            7,
          ),
          '--panel-text-accent': themeData.colors['editor.background'].slice(
            0,
            7,
          ),
          '--panel-background': themeData.colors['editor.background'].slice(
            0,
            7,
          ),
          '--status-bar-text': themeData.base === 'vs-dark' ? 'dark' : 'light',
        });
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    }
  }

  // Apply theme to Monaco if it's available
  if (globalMonaco && savedTheme) {
    globalMonaco.editor.setTheme(savedTheme);
  }
};

// Run initialization immediately (without hooks)
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after the browser has fully loaded
  setTimeout(initEditorTheme, 0);
}

// Export a utility function that components can use to apply a theme
export const applyEditorTheme = (key: string, value: string) => {
  localStorage.setItem('editorTheme', key);

  if (key in DEFAULT_THEMES) {
    const themeConfig = DEFAULT_THEMES[key as keyof typeof DEFAULT_THEMES];
    setCSSVariables(themeConfig.variables);
    setCSSVariables({ '--status-bar-text': '#fff' });

    // Set document classes
    if (key === 'vs-dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const themeData = require(`monaco-themes/themes/${value}.json`);

      // Set document classes
      if (themeData.base === 'vs-dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }

      setCSSVariables({
        '--toolbar-bg-primary': themeData.colors[
          'editor.selectionBackground'
        ].slice(0, 7),
        '--toolbar-bg-secondary': themeData.colors[
          'editor.selectionBackground'
        ].slice(0, 7),
        '--toolbar-foreground': themeData.colors['editor.foreground'].slice(
          0,
          7,
        ),
        '--toolbar-accent': themeData.colors['editorCursor.foreground'].slice(
          0,
          7,
        ),
        '--panel-text-accent': themeData.colors['editor.background'].slice(
          0,
          7,
        ),
        '--panel-background': themeData.colors['editor.background'].slice(0, 7),
        '--status-bar-text': themeData.base === 'vs-dark' ? 'dark' : 'light',
      });
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  }

  if (globalMonaco) {
    globalMonaco.editor.setTheme(key);
  }

  // Return the appropriate next-themes value
  if (key === 'vs-dark') {
    return 'dark';
  } else if (key in DEFAULT_THEMES) {
    return 'light';
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const themeData = require(`monaco-themes/themes/${value}.json`);
      return themeData.base === 'vs-dark' ? 'dark' : 'light';
    } catch (error) {
      console.error('Failed to determine theme mode:', error);
      return 'dark';
    }
  }
};

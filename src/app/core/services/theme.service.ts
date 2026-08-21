import { Injectable, computed, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'cinetick_theme_preference';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  /**
   * Centralized Angular Signal holding the active theme ('light' | 'dark').
   */
  readonly currentTheme = signal<ThemeMode>(this.getInitialTheme());

  /**
   * Derived reactive boolean signals for convenience.
   */
  readonly isDarkMode = computed(() => this.currentTheme() === 'dark');
  readonly isLightMode = computed(() => this.currentTheme() === 'light');

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  /**
   * Toggles the current theme between light and dark.
   */
  toggleTheme(): void {
    const nextTheme: ThemeMode = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  /**
   * Explicitly sets the active theme, persists it, and updates DOM.
   */
  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    this.persistTheme(theme);
    this.applyTheme(theme);
  }

  /**
   * Determines the initial theme on application boot:
   * 1. Checks localStorage for a previously saved preference.
   * 2. If absent, checks OS system preference.
   * 3. Falls back to 'dark' to preserve the cinema brand identity.
   */
  private getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 'dark';
    }

    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }

      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // Fallback in case of sandboxed iframe or disabled localStorage
    }

    return 'dark';
  }

  /**
   * Persists the selected theme in localStorage.
   */
  private persistTheme(theme: ThemeMode): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Applies the theme globally to the document element for CSS variables & styling.
   */
  private applyTheme(theme: ThemeMode): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body?.classList.add('light-theme');
      document.body?.classList.remove('dark-theme');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body?.classList.add('dark-theme');
      document.body?.classList.remove('light-theme');
    }
  }
}

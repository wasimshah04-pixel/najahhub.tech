import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const ThemeContext = createContext(null);

const DEFAULT_THEME = {
  color_background: '#FFFFFF',
  color_text: '#111111',
  color_primary: '#000000',
  color_secondary: '#4A4A4A',
  color_accent: '#000000',
  color_button: '#000000',
  color_border: '#E5E5E5',
  color_success: '#1E7E34',
  color_warning: '#B8860B',
  color_danger: '#C1121F',
};

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await api.get('/settings/public');
      setSettings(data.settings);

      // Apply theme tokens to CSS custom properties
      if (data.settings.theme) {
        applyTheme(data.settings.theme);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const tokenMap = {
      color_background: '--color-background',
      color_text: '--color-text',
      color_primary: '--color-primary',
      color_secondary: '--color-secondary',
      color_accent: '--color-accent',
      color_button: '--color-button',
      color_border: '--color-border',
      color_success: '--color-success',
      color_warning: '--color-warning',
      color_danger: '--color-danger',
    };

    Object.entries(tokenMap).forEach(([key, cssVar]) => {
      const value = theme[key] || DEFAULT_THEME[key];
      if (value) {
        root.style.setProperty(cssVar, value);
      }
    });
  }

  const getSetting = useCallback((group, key, fallback = '') => {
    if (settings[group] && settings[group][key] !== undefined) {
      return settings[group][key];
    }
    return fallback;
  }, [settings]);

  const siteName = getSetting('general', 'site_name', 'SANHI');
  const siteSubtitle = getSetting('general', 'site_subtitle', 'Premium Clothing');
  const currencySymbol = getSetting('general', 'currency_symbol', '₹');

  const value = {
    settings,
    loading,
    getSetting,
    reloadSettings: loadSettings,
    siteName,
    siteSubtitle,
    currencySymbol,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

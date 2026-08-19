import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast/Toast';
import { api } from '../../utils/api';
import './AdminTheme.css';

const PRESETS = {
  'black-white': { color_primary: '#000000', color_secondary: '#4A4A4A', color_accent: '#000000', color_button: '#000000', color_text: '#111111', color_background: '#FFFFFF', color_border: '#E5E5E5' },
  red: { color_primary: '#991B1B', color_secondary: '#7F1D1D', color_accent: '#B91C1C', color_button: '#991B1B', color_text: '#111111', color_background: '#FEF2F2', color_border: '#FECACA' },
  green: { color_primary: '#065F46', color_secondary: '#047857', color_accent: '#059669', color_button: '#065F46', color_text: '#111111', color_background: '#F0FDF4', color_border: '#BBF7D0' },
  yellow: { color_primary: '#92400E', color_secondary: '#B45309', color_accent: '#D97706', color_button: '#92400E', color_text: '#111111', color_background: '#FFFBEB', color_border: '#FDE68A' },
};

export default function AdminTheme() {
  const { getSetting } = useTheme();
  const toast = useToast();
  const [activePreset, setActivePreset] = useState(getSetting('theme', 'theme_preset', 'black-white'));
  const [tokens, setTokens] = useState({
    color_primary: getSetting('theme', 'color_primary', '#000000'),
    color_secondary: getSetting('theme', 'color_secondary', '#4A4A4A'),
    color_accent: getSetting('theme', 'color_accent', '#000000'),
    color_button: getSetting('theme', 'color_button', '#000000'),
    color_text: getSetting('theme', 'color_text', '#111111'),
    color_background: getSetting('theme', 'color_background', '#FFFFFF'),
    color_border: getSetting('theme', 'color_border', '#E5E5E5'),
  });
  const [saving, setSaving] = useState(false);

  const applyLive = (t) => {
    const r = document.documentElement;
    r.style.setProperty('--color-primary', t.color_primary);
    r.style.setProperty('--color-secondary', t.color_secondary);
    r.style.setProperty('--color-accent', t.color_accent);
    r.style.setProperty('--color-button', t.color_button);
    r.style.setProperty('--color-text', t.color_text);
    r.style.setProperty('--color-background', t.color_background);
    r.style.setProperty('--color-border', t.color_border);
  };

  const handlePreset = (name) => {
    setActivePreset(name);
    const updated = { ...tokens, ...PRESETS[name] };
    setTokens(updated);
    applyLive(updated);
  };

  const handleToken = (key, val) => {
    const updated = { ...tokens, [key]: val };
    setTokens(updated);
    applyLive(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = [
        { key: 'theme_preset', value: activePreset, group_name: 'theme' },
        ...Object.entries(tokens).map(([k, v]) => ({ key: k, value: v, group_name: 'theme' })),
      ];
      await api.post('/admin/settings', { settings: payload });
      toast.success('Theme published');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-topbar">
        <h1 className="admin-page-title">Theme</h1>
      </div>

      <div className="admin-theme-layout">
        {/* Controls */}
        <div>
          <div className="admin-card admin-card--padded" style={{ marginBottom: 16 }}>
            <h3 className="admin-section-heading">Presets</h3>
            <div className="admin-preset-grid">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`admin-preset ${activePreset === name ? 'admin-preset--active' : ''}`}
                  onClick={() => handlePreset(name)}
                >
                  <div className="admin-preset__swatch" style={{ background: PRESETS[name].color_primary }} />
                  <span className="admin-preset__name">{name.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card admin-card--padded">
            <h3 className="admin-section-heading">Color Tokens</h3>
            <form onSubmit={handleSave}>
              <div className="admin-token-grid">
                {Object.entries(tokens).map(([key, val]) => (
                  <div key={key} className="admin-token-row">
                    <label className="input-label">{key.replace('color_', '')}</label>
                    <div className="admin-token-input">
                      <input type="color" value={val} onChange={(e) => handleToken(key, e.target.value)} className="admin-color-pick" />
                      <input type="text" className="input" value={val} onChange={(e) => handleToken(key, e.target.value)} style={{ fontSize: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" className="btn btn--primary btn--full" disabled={saving} style={{ marginTop: 16 }}>
                {saving ? 'Saving...' : 'Publish Theme'}
              </button>
            </form>
          </div>
        </div>

        {/* Preview */}
        <div className="admin-card admin-card--padded">
          <h3 className="admin-section-heading">Live Preview</h3>
          <div className="admin-theme-preview">
            <span style={{ fontSize: 20, fontWeight: 700 }}>Sample Headline</span>
            <p style={{ color: 'var(--color-secondary)', fontSize: 14 }}>This previews your color tokens in real time.</p>
            <button className="btn btn--primary btn--sm">Primary Button</button>
          </div>
        </div>
      </div>
    </div>
  );
}

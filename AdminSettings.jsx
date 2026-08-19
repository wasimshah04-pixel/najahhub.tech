import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast/Toast';
import { api } from '../../utils/api';
import './AdminSettings.css';

export default function AdminSettings() {
  const { siteName, siteSubtitle, getSetting, reloadSettings } = useTheme();
  const toast = useToast();

  const [name, setName] = useState(siteName);
  const [subtitle, setSubtitle] = useState(siteSubtitle);
  const [email, setEmail] = useState(getSetting('general', 'contact_email', ''));
  const [phone, setPhone] = useState(getSetting('general', 'contact_phone', ''));
  const [address, setAddress] = useState(getSetting('general', 'address', ''));
  const [whatsapp, setWhatsapp] = useState(getSetting('general', 'whatsapp_number', ''));

  // Announcement Bar States
  const [annoEnabled, setAnnoEnabled] = useState(
    getSetting('announcement', 'announcement_enabled', '1') === '1' ||
    getSetting('announcement', 'announcement_enabled', '1') === 'true'
  );
  const [annoText, setAnnoText] = useState(
    getSetting('announcement', 'announcement_text', '✨ SPECIAL OFFER: GET 20% OFF YOUR FIRST ORDER — USE CODE: WELCOME10')
  );
  const [annoLink, setAnnoLink] = useState(getSetting('announcement', 'announcement_link', '/shop'));
  const [annoBgColor, setAnnoBgColor] = useState(getSetting('announcement', 'announcement_bg_color', '#000000'));
  const [annoTextColor, setAnnoTextColor] = useState(getSetting('announcement', 'announcement_text_color', '#FFFFFF'));

  // Social Media States
  const [socialInstagram, setSocialInstagram] = useState(getSetting('social', 'instagram_url', ''));
  const [socialFacebook, setSocialFacebook] = useState(getSetting('social', 'facebook_url', ''));
  const [socialTwitter, setSocialTwitter] = useState(getSetting('social', 'twitter_url', ''));
  const [socialYoutube, setSocialYoutube] = useState(getSetting('social', 'youtube_url', ''));
  const [socialPinterest, setSocialPinterest] = useState(getSetting('social', 'pinterest_url', ''));

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingAnno, setSavingAnno] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      await api.post('/admin/settings', {
        settings: [
          { key: 'site_name', value: name, group_name: 'general' },
          { key: 'site_subtitle', value: subtitle, group_name: 'general' },
          { key: 'contact_email', value: email, group_name: 'general' },
          { key: 'contact_phone', value: phone, group_name: 'general' },
          { key: 'address', value: address, group_name: 'general' },
          { key: 'whatsapp_number', value: whatsapp, group_name: 'general' },
        ],
      });
      await reloadSettings();
      toast.success('General settings saved');
    } catch (err) {
      toast.error('Failed to save general settings');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveAnno = async (e) => {
    e.preventDefault();
    setSavingAnno(true);
    try {
      await api.post('/admin/settings', {
        settings: [
          { key: 'announcement_enabled', value: annoEnabled ? '1' : '0', group_name: 'announcement' },
          { key: 'announcement_text', value: annoText, group_name: 'announcement' },
          { key: 'announcement_link', value: annoLink, group_name: 'announcement' },
          { key: 'announcement_bg_color', value: annoBgColor, group_name: 'announcement' },
          { key: 'announcement_text_color', value: annoTextColor, group_name: 'announcement' },
        ],
      });
      await reloadSettings();
      toast.success('Announcement bar saved & updated live!');
    } catch (err) {
      toast.error('Failed to save announcement bar settings');
    } finally {
      setSavingAnno(false);
    }
  };

  const handleSaveSocial = async (e) => {
    e.preventDefault();
    setSavingSocial(true);
    try {
      await api.post('/admin/settings', {
        settings: [
          { key: 'instagram_url', value: socialInstagram, group_name: 'social' },
          { key: 'facebook_url', value: socialFacebook, group_name: 'social' },
          { key: 'twitter_url', value: socialTwitter, group_name: 'social' },
          { key: 'youtube_url', value: socialYoutube, group_name: 'social' },
          { key: 'pinterest_url', value: socialPinterest, group_name: 'social' },
        ],
      });
      await reloadSettings();
      toast.success('Social media links saved');
    } catch (err) {
      toast.error('Failed to save social media settings');
    } finally {
      setSavingSocial(false);
    }
  };

  const handleBackup = async () => {
    setBackupStatus('Creating backup...');
    try {
      const res = await api.post('/admin/backups', {});
      setBackupStatus(`Created: ${res.backup.filename}`);
      toast.success('Backup created');
    } catch (err) {
      setBackupStatus('Backup failed');
      toast.error('Failed');
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-topbar">
        <h1 className="admin-page-title">Settings</h1>
      </div>

      <div className="admin-settings-layout">
        {/* 1. Announcement Bar Settings */}
        <div className="admin-card admin-card--padded">
          <h3 className="admin-section-heading">Top Notification Offer Bar</h3>
          <p className="admin-settings-desc">
            Display a clickable offer or announcement bar at the top of every page above the main header.
          </p>

          <form onSubmit={handleSaveAnno}>
            <div className="input-group">
              <label className="input-label checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={annoEnabled}
                  onChange={(e) => setAnnoEnabled(e.target.checked)}
                />
                <span>Enable Top Announcement Bar</span>
              </label>
            </div>

            <div className="input-group">
              <label className="input-label">Announcement Title / Offer Text</label>
              <input
                type="text"
                className="input"
                value={annoText}
                onChange={(e) => setAnnoText(e.target.value)}
                placeholder="e.g. ✨ SUMMER SALE: GET 20% OFF — USE CODE: SUMMER2026"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Clickable Target Link (Product / Category / Offer URL)</label>
              <input
                type="text"
                className="input"
                value={annoLink}
                onChange={(e) => setAnnoLink(e.target.value)}
                placeholder="e.g. /shop, /product/linen-classic-shirt, or https://..."
              />
              <span className="help-text" style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                Internal routes start with <code>/</code> (e.g. <code>/shop</code>, <code>/product/slug</code>). External URLs start with <code>https://</code>.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="input-group">
                <label className="input-label">Background Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    style={{ width: '36px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    value={annoBgColor}
                    onChange={(e) => setAnnoBgColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input"
                    value={annoBgColor}
                    onChange={(e) => setAnnoBgColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Text Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    style={{ width: '36px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    value={annoTextColor}
                    onChange={(e) => setAnnoTextColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input"
                    value={annoTextColor}
                    onChange={(e) => setAnnoTextColor(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--full" disabled={savingAnno}>
              {savingAnno ? 'Saving...' : 'Save Announcement Bar'}
            </button>
          </form>
        </div>

        {/* 2. General */}
        <div className="admin-card admin-card--padded">
          <h3 className="admin-section-heading">General Settings</h3>
          <form onSubmit={handleSaveGeneral}>
            <div className="input-group">
              <label className="input-label">Website Name</label>
              <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Tagline</label>
              <input type="text" className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Contact Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input type="text" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Address</label>
              <textarea className="input" rows="2" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">WhatsApp Number (with country code, no + or spaces)</label>
              <input type="text" className="input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="e.g. 919876543210" />
              <span className="help-text" style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                Include country code without <code>+</code>. Example: <code>91</code> for India, then number.
              </span>
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={savingGeneral}>
              {savingGeneral ? 'Saving...' : 'Save General Settings'}
            </button>
          </form>
        </div>

        {/* 3. Social Media */}
        <div className="admin-card admin-card--padded">
          <h3 className="admin-section-heading">Social Media Links</h3>
          <p className="admin-settings-desc">
            Add your social media profile URLs. These will appear as icons in the website footer. Leave blank to hide an icon.
          </p>

          <form onSubmit={handleSaveSocial}>
            <div className="input-group">
              <label className="input-label">Instagram URL</label>
              <input
                type="url"
                className="input"
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Facebook URL</label>
              <input
                type="url"
                className="input"
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Twitter / X URL</label>
              <input
                type="url"
                className="input"
                value={socialTwitter}
                onChange={(e) => setSocialTwitter(e.target.value)}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            <div className="input-group">
              <label className="input-label">YouTube URL</label>
              <input
                type="url"
                className="input"
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Pinterest URL</label>
              <input
                type="url"
                className="input"
                value={socialPinterest}
                onChange={(e) => setSocialPinterest(e.target.value)}
                placeholder="https://pinterest.com/yourprofile"
              />
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={savingSocial}>
              {savingSocial ? 'Saving...' : 'Save Social Media Links'}
            </button>
          </form>
        </div>

        {/* 4. Backup */}
        <div className="admin-card admin-card--padded">
          <h3 className="admin-section-heading">Backup</h3>
          <p className="admin-settings-desc">
            Export a snapshot of the SQLite database to <code>storage/backups/</code>.
          </p>
          <button type="button" className="btn btn--outline btn--full" onClick={handleBackup}>
            Create Backup
          </button>
          {backupStatus && <p className="admin-settings-status">{backupStatus}</p>}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast/Toast';
import './AdminPages.css';

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [published, setPublished] = useState(true);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => { loadPages(); }, []);

  async function loadPages() {
    setLoading(true);
    try {
      const res = await api.get('/admin/pages');
      setPages(res.pages || []);
      if (res.pages?.length) selectPage(res.pages[0]);
    } catch (err) {
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  }

  const selectPage = (pg) => {
    setSelected(pg);
    setContent(pg.content || '');
    setMetaTitle(pg.meta_title || '');
    setMetaDesc(pg.meta_description || '');
    setPublished(!!pg.is_published);
    setPreview(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/admin/pages/${selected.id}`, {
        content, meta_title: metaTitle, meta_description: metaDesc, is_published: published,
      });
      toast.success('Saved');
      loadPages();
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-topbar">
        <h1 className="admin-page-title">CMS Pages</h1>
      </div>

      {loading ? (
        <div className="admin-skeleton-list">
          {[...Array(3)].map((_, i) => <div key={i} className="admin-skeleton-row" />)}
        </div>
      ) : (
        <div className="admin-cms-layout">
          {/* Sidebar */}
          <div className="admin-cms-sidebar">
            <div className="admin-cms-list">
              {pages.map((pg) => (
                <button
                  key={pg.id}
                  className={`admin-cms-item ${selected?.id === pg.id ? 'admin-cms-item--active' : ''}`}
                  onClick={() => selectPage(pg)}
                >
                  <span className="admin-cms-item__title">{pg.title}</span>
                  <span className="admin-cms-item__slug">/{pg.slug}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="admin-cms-editor">
            {selected && (
              <form onSubmit={handleSave}>
                <div className="admin-cms-editor__topbar">
                  <h2 className="admin-cms-editor__title">{selected.title}</h2>
                  <div className="admin-cms-editor__actions">
                    <button
                      type="button"
                      className={`btn btn--outline btn--sm ${preview ? 'active' : ''}`}
                      onClick={() => setPreview(!preview)}
                    >
                      {preview ? 'Edit' : 'Preview'}
                    </button>
                    <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
                      {saving ? 'Saving...' : 'Publish'}
                    </button>
                  </div>
                </div>

                {preview ? (
                  <div className="admin-cms-preview">
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{selected.title}</h1>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
                ) : (
                  <>
                    <div className="input-group">
                      <label className="input-label">HTML Content</label>
                      <textarea
                        className="input admin-cms-textarea"
                        rows="14"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>

                    <div className="admin-form-grid" style={{ marginTop: 16 }}>
                      <div className="input-group">
                        <label className="input-label">SEO Title</label>
                        <input type="text" className="input" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">SEO Description</label>
                        <input type="text" className="input" value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} />
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                      Published
                    </label>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

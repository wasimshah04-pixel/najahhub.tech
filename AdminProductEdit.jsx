import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast/Toast';
import './AdminProductEdit.css';

export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('50');
  const [isFeatured, setIsFeatured] = useState(false);
  const [description, setDescription] = useState('');

  // Images: array of { type: 'url'|'file', value: string, preview: string }
  const [images, setImages] = useState([]);
  const [imageInput, setImageInput] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCategories();
    if (!isNew) loadProduct();
  }, [id]);

  async function loadCategories() {
    try {
      const res = await api.get('/categories');
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  async function loadProduct() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/products/${id}`);
      const p = res.product || res;
      setTitle(p.title || '');
      setPrice(p.price?.toString() || '');
      setComparePrice(p.compare_at_price?.toString() || '');
      setCategoryId(p.category_id?.toString() || '');
      setSku(p.sku || '');
      setStock(p.stock?.toString() || '50');
      setIsFeatured(!!p.is_featured);
      setDescription(p.description || '');

      // Load existing images
      const existingImages = [];
      if (p.primary_image) {
        existingImages.push({ type: 'url', value: p.primary_image, preview: p.primary_image });
      }
      if (p.images && Array.isArray(p.images)) {
        p.images.forEach((img) => {
          if (img !== p.primary_image) {
            existingImages.push({ type: 'url', value: img, preview: img });
          }
        });
      }
      setImages(existingImages);
    } catch (err) {
      toast.error('Failed to load product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  }

  const handleAddUrlImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Please enter a valid URL');
      return;
    }
    setImages((prev) => [...prev, { type: 'url', value: url, preview: url }]);
    setImageInput('');
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.upload('/uploads', formData);
        const url = res.url || res.imageUrl || res.path;
        if (url) {
          setImages((prev) => [...prev, { type: 'url', value: url, preview: url }]);
        }
      }
      toast.success('Images uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (index, direction) => {
    setImages((prev) => {
      const arr = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return arr;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price) {
      toast.error('Title and price are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        price: parseFloat(price),
        compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
        category_id: categoryId ? parseInt(categoryId) : null,
        sku,
        stock: parseInt(stock),
        is_featured: isFeatured,
        description,
        images: images.map((img) => img.value),
      };

      if (!isNew) {
        await api.put(`/admin/products/${id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-edit-loading">
        <div className="admin-spinner" />
      </div>
    );
  }

  return (
    <div className="admin-product-edit animate-fade-in">
      {/* Top Bar */}
      <div className="edit-topbar">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/admin/products')}>
          ← Back to Products
        </button>
        <div className="edit-topbar__actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={() => navigate('/admin/products')}>
            Cancel
          </button>
          <button type="submit" form="product-form" className="btn btn--primary btn--sm" disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="edit-layout">
        {/* Left: Main Content */}
        <div className="edit-main">
          {/* Title */}
          <div className="edit-card">
            <label className="edit-card__label">Product Title</label>
            <input
              type="text"
              className="edit-input edit-input--lg"
              placeholder="e.g. Classic White Tee"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="edit-card">
            <label className="edit-card__label">Description</label>
            <textarea
              className="edit-input edit-textarea"
              placeholder="Describe your product..."
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Media */}
          <div className="edit-card">
            <label className="edit-card__label">Media</label>

            {/* Image URL Input */}
            <div className="edit-image-url-row">
              <input
                type="text"
                className="edit-input"
                placeholder="Paste image URL and press Add"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrlImage())}
              />
              <button type="button" className="btn btn--outline btn--sm" onClick={handleAddUrlImage}>
                Add URL
              </button>
            </div>

            {/* File Upload */}
            <div className="edit-file-upload">
              <label className="edit-file-label">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="edit-file-input"
                  disabled={uploading}
                />
                <span className="edit-file-btn">
                  {uploading ? 'Uploading...' : 'Upload from Computer'}
                </span>
              </label>
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
              <div className="edit-image-grid">
                {images.map((img, idx) => (
                  <div key={idx} className="edit-image-thumb">
                    <img src={img.preview} alt={`Product ${idx + 1}`} />
                    <div className="edit-image-actions">
                      {idx > 0 && (
                        <button type="button" className="edit-img-btn" onClick={() => handleMoveImage(idx, -1)} title="Move left">←</button>
                      )}
                      {idx < images.length - 1 && (
                        <button type="button" className="edit-img-btn" onClick={() => handleMoveImage(idx, 1)} title="Move right">→</button>
                      )}
                      <button type="button" className="edit-img-btn edit-img-btn--danger" onClick={() => handleRemoveImage(idx)} title="Remove">✕</button>
                    </div>
                    {idx === 0 && <span className="edit-image-badge">Primary</span>}
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <div className="edit-image-empty">
                <p>No images yet. Add via URL or upload from computer.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="edit-sidebar">
          {/* Pricing */}
          <div className="edit-card">
            <label className="edit-card__label">Pricing</label>
            <div className="edit-field">
              <label className="edit-field__label">Price (₹)</label>
              <input
                type="number"
                className="edit-input"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="edit-field">
              <label className="edit-field__label">Compare at Price (₹)</label>
              <input
                type="number"
                className="edit-input"
                placeholder="0.00"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                min="0"
                step="0.01"
              />
              <span className="edit-field__hint">Show as strikethrough price</span>
            </div>
          </div>

          {/* Organization */}
          <div className="edit-card">
            <label className="edit-card__label">Organization</label>
            <div className="edit-field">
              <label className="edit-field__label">Category</label>
              <select
                className="edit-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="edit-field">
              <label className="edit-field__label">SKU</label>
              <input
                type="text"
                className="edit-input"
                placeholder="e.g. WH-Tee-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div className="edit-field">
              <label className="edit-field__label">Stock</label>
              <input
                type="number"
                className="edit-input"
                placeholder="50"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="edit-card">
            <label className="edit-card__label">Visibility</label>
            <label className="edit-toggle">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span className="edit-toggle__slider" />
              <span className="edit-toggle__label">Featured on Homepage</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}

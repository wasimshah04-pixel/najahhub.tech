import { Router } from 'express';

const router = Router();

// GET /api/settings/public — Public settings (no auth required)
router.get('/public', (req, res) => {
  try {
    const db = req.app.get('db');
    const settings = db.prepare(`
      SELECT key, value, group_name FROM settings
      WHERE group_name IN ('general', 'social', 'seo', 'theme', 'shipping', 'announcement')
    `).all();

    // Transform into grouped object
    const grouped = {};
    for (const s of settings) {
      if (!grouped[s.group_name]) grouped[s.group_name] = {};
      grouped[s.group_name][s.key] = s.value;
    }

    res.json({ settings: grouped });
  } catch (err) {
    console.error('[Settings] Public error:', err.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/settings/reviews — Approved reviews for homepage
router.get('/reviews', (req, res) => {
  try {
    const db = req.app.get('db');
    const { limit = 8 } = req.query;

    const reviews = db.prepare(`
      SELECT
        r.id, r.user_name, r.rating, r.comment, r.created_at,
        p.title as product_title, p.slug as product_slug,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.is_approved = 1 AND r.rating >= 4
      ORDER BY r.rating DESC, r.created_at DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json({ reviews });
  } catch (err) {
    console.error('[Settings] Reviews error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/settings/page/:slug — Get CMS page by slug
router.get('/page/:slug', (req, res) => {
  try {
    const db = req.app.get('db');
    const page = db.prepare(`
      SELECT id, title, slug, content, meta_title, meta_description
      FROM pages
      WHERE slug = ? AND is_published = 1
    `).get(req.params.slug);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ page });
  } catch (err) {
    console.error('[Settings] Page error:', err.message);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

export default router;

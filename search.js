import { Router } from 'express';

const router = Router();

// GET /api/search — Instant search
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const { q, limit = 6 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ products: [], suggestions: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    const products = db.prepare(`
      SELECT
        p.id, p.title, p.slug, p.price, p.compare_at_price,
        c.name as category_name,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
        AND (p.title LIKE ? OR p.tags LIKE ? OR c.name LIKE ?)
      ORDER BY
        CASE WHEN p.title LIKE ? THEN 0 ELSE 1 END,
        p.is_featured DESC
      LIMIT ?
    `).all(searchTerm, searchTerm, searchTerm, `${q.trim()}%`, parseInt(limit));

    // Log the search
    const sessionId = req.query.session_id || '';
    db.prepare(`
      INSERT INTO search_logs (query, session_id, results_count) VALUES (?, ?, ?)
    `).run(q.trim(), sessionId, products.length);

    res.json({ products });
  } catch (err) {
    console.error('[Search] Error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/search/popular — Popular search terms
router.get('/popular', (req, res) => {
  try {
    const db = req.app.get('db');
    const { limit = 6 } = req.query;

    const popular = db.prepare(`
      SELECT query, COUNT(*) as count
      FROM search_logs
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY LOWER(query)
      ORDER BY count DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json({ popular: popular.map(p => p.query) });
  } catch (err) {
    console.error('[Search] Popular error:', err.message);
    res.status(500).json({ error: 'Failed to fetch popular searches' });
  }
});

// GET /api/search/suggestions — Search suggestions based on product titles
router.get('/suggestions', (req, res) => {
  try {
    const db = req.app.get('db');
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({ suggestions: [] });
    }

    const suggestions = db.prepare(`
      SELECT DISTINCT title as suggestion
      FROM products
      WHERE is_active = 1 AND title LIKE ?
      ORDER BY is_featured DESC
      LIMIT ?
    `).all(`%${q.trim()}%`, parseInt(limit));

    res.json({ suggestions: suggestions.map(s => s.suggestion) });
  } catch (err) {
    console.error('[Search] Suggestions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;

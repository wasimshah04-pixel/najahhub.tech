import { Router } from 'express';

const router = Router();

// GET /api/categories — All categories
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const categories = db.prepare(`
      SELECT
        c.id, c.name, c.slug, c.description, c.image, c.position, c.parent_id,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      ORDER BY c.position ASC
    `).all();

    res.json({ categories });
  } catch (err) {
    console.error('[Categories] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:slug — Single category with product count
router.get('/:slug', (req, res) => {
  try {
    const db = req.app.get('db');
    const category = db.prepare(`
      SELECT
        c.id, c.name, c.slug, c.description, c.image,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      WHERE c.slug = ?
    `).get(req.params.slug);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (err) {
    console.error('[Categories] Detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

export default router;

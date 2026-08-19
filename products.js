import { Router } from 'express';

const router = Router();

// GET /api/products — List products with filtering, sorting, pagination
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const {
      page = 1,
      limit = 12,
      category,
      collection,
      search,
      sort = 'newest',
      min_price,
      max_price,
      size,
      color,
      availability,
      tag,
      featured,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['p.is_active = 1'];
    let params = [];

    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }

    if (collection) {
      where.push('col.slug = ?');
      params.push(collection);
    }

    if (search) {
      where.push('(p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (min_price) {
      where.push('p.price >= ?');
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      where.push('p.price <= ?');
      params.push(parseFloat(max_price));
    }

    if (availability === 'in_stock') {
      where.push('p.stock > 0');
    } else if (availability === 'out_of_stock') {
      where.push('p.stock = 0');
    }

    if (tag) {
      where.push('p.tags LIKE ?');
      params.push(`%${tag}%`);
    }

    if (featured === '1' || featured === 'true') {
      where.push('p.is_featured = 1');
    }

    // Handle hide_when_out_of_stock
    where.push('(p.stock > 0 OR p.hide_when_out_of_stock = 0)');

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    let orderBy;
    switch (sort) {
      case 'price_asc': orderBy = 'p.price ASC'; break;
      case 'price_desc': orderBy = 'p.price DESC'; break;
      case 'name_asc': orderBy = 'p.title ASC'; break;
      case 'name_desc': orderBy = 'p.title DESC'; break;
      case 'oldest': orderBy = 'p.created_at ASC'; break;
      case 'bestseller': orderBy = 'p.is_featured DESC, p.created_at DESC'; break;
      default: orderBy = 'p.created_at DESC';
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      ${whereClause}
    `;
    const { total } = db.prepare(countQuery).get(...params);

    // Get products
    const query = `
      SELECT DISTINCT
        p.id, p.title, p.slug, p.description, p.price, p.compare_at_price,
        p.sku, p.stock, p.is_featured, p.tags, p.created_at,
        c.name as category_name, c.slug as category_slug,
        col.name as collection_name,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 0 ORDER BY position LIMIT 1) as secondary_image,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.id AND is_approved = 1) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const products = db.prepare(query).all(...params, parseInt(limit), offset);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[Products] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/featured — Featured products for homepage
router.get('/featured', (req, res) => {
  try {
    const db = req.app.get('db');
    const { limit = 8 } = req.query;

    const products = db.prepare(`
      SELECT
        p.id, p.title, p.slug, p.price, p.compare_at_price, p.stock, p.is_featured, p.tags,
        c.name as category_name, c.slug as category_slug,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 0 ORDER BY position LIMIT 1) as secondary_image,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.id AND is_approved = 1) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.is_featured = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json({ products });
  } catch (err) {
    console.error('[Products] Featured error:', err.message);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// GET /api/products/new-arrivals — Latest products
router.get('/new-arrivals', (req, res) => {
  try {
    const db = req.app.get('db');
    const { limit = 8 } = req.query;

    const products = db.prepare(`
      SELECT
        p.id, p.title, p.slug, p.price, p.compare_at_price, p.stock, p.tags,
        c.name as category_name, c.slug as category_slug,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 0 ORDER BY position LIMIT 1) as secondary_image,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.id AND is_approved = 1) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json({ products });
  } catch (err) {
    console.error('[Products] New arrivals error:', err.message);
    res.status(500).json({ error: 'Failed to fetch new arrivals' });
  }
});

// GET /api/products/best-sellers — Best sellers (featured + highest rated)
router.get('/best-sellers', (req, res) => {
  try {
    const db = req.app.get('db');
    const { limit = 8 } = req.query;

    const products = db.prepare(`
      SELECT
        p.id, p.title, p.slug, p.price, p.compare_at_price, p.stock, p.tags,
        c.name as category_name, c.slug as category_slug,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 0 ORDER BY position LIMIT 1) as secondary_image,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.id AND is_approved = 1) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1) DESC, p.is_featured DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json({ products });
  } catch (err) {
    console.error('[Products] Best sellers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch best sellers' });
  }
});

// GET /api/products/:slug — Single product with full detail
router.get('/:slug', (req, res) => {
  try {
    const db = req.app.get('db');
    const { slug } = req.params;

    const product = db.prepare(`
      SELECT
        p.*,
        c.name as category_name, c.slug as category_slug,
        col.name as collection_name, col.slug as collection_slug,
        b.name as brand_name,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.id AND is_approved = 1) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = ? AND p.is_active = 1
    `).get(slug);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get images
    const images = db.prepare(`
      SELECT id, url, alt_text, position, is_primary
      FROM product_images
      WHERE product_id = ?
      ORDER BY position
    `).all(product.id);

    // Get variants
    const variants = db.prepare(`
      SELECT id, name, type, value, price_modifier, stock, sku
      FROM product_variants
      WHERE product_id = ?
      ORDER BY type, name
    `).all(product.id);

    // Get reviews
    const reviews = db.prepare(`
      SELECT id, user_name, rating, comment, created_at
      FROM reviews
      WHERE product_id = ? AND is_approved = 1
      ORDER BY created_at DESC
      LIMIT 10
    `).all(product.id);

    // Get related products (same category)
    const related = db.prepare(`
      SELECT
        p.id, p.title, p.slug, p.price, p.compare_at_price, p.stock,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 0 ORDER BY position LIMIT 1) as secondary_image,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.id AND is_approved = 1) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1) as review_count
      FROM products p
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY RANDOM()
      LIMIT 4
    `).all(product.category_id, product.id);

    res.json({
      product: {
        ...product,
        images,
        variants,
        reviews,
      },
      related,
    });
  } catch (err) {
    console.error('[Products] Detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', '..', 'database', 'shop.db');

export function initDatabase() {
  // Ensure database directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Ensure storage directories exist
  const storageBase = path.join(__dirname, '..', '..', 'storage');
  const storageDirs = ['products', 'uploads', 'banners', 'logos', 'pages', 'temp', 'backups'];
  storageDirs.forEach(dir => {
    const fullPath = path.join(storageBase, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables(db);
  seedData(db);
  migrateLocalImages(db);

  return db;
}

function migrateLocalImages(db) {
  const urlMap = {
    'photo-1521572163474-6864f9cf17ab': 'tee-crew-front.jpg',
    'photo-1622445275463-afa2ab738c34': 'tee-crew-back.jpg',
    'photo-1542272604-787c3835535d': 'jeans-black-front.jpg',
    'photo-1541099649105-f69ad21f3246': 'jeans-black-detail.jpg',
    'photo-1596755094514-f87e34085b2c': 'shirt-oxford-front.jpg',
    'photo-1598032895455-1b82f8a4f510': 'shirt-oxford-detail.jpg',
    'photo-1595777457583-95e059d581b8': 'dress-linen-front.jpg',
    'photo-1572804013309-59a88b7e92f1': 'dress-linen-side.jpg',
    'photo-1576566588028-4147f3842f27': 'tee-graphic-front.jpg',
    'photo-1583743814966-8936f5b7be1a': 'tee-graphic-back.jpg',
    'photo-1473966968600-fa801b869a1a': 'chino-front.jpg',
    'photo-1624378439575-d8705ad7ae80': 'chino-detail.jpg',
    'photo-1551028719-00167b16eac5': 'jacket-bomber-front.jpg',
    'photo-1591047139829-d91aecb6caea': 'jacket-bomber-back.jpg',
    'photo-1523170335258-f5ed11844a49': 'watch-leather-front.jpg',
    'photo-1524592094714-0f0654e20314': 'watch-leather-detail.jpg',
    'photo-1564257631407-4deb1f99d992': 'blouse-floral-front.jpg',
    'photo-1551803091-e20673f15770': 'blouse-floral-style.jpg',
    'photo-1525966222134-fcfa99b8ae77': 'sneakers-canvas-front.jpg',
    'photo-1460353581641-37baddab0fa2': 'sneakers-canvas-side.jpg',
    'photo-1434389677669-e08b4cda3a20': 'pullover-merino-front.jpg',
    'photo-1614975059251-992f11792571': 'pullover-merino-detail.jpg',
    'photo-1594938298603-c8148c4dae35': 'trousers-wide-front.jpg',
    'photo-1506629082955-511b1aa562c8': 'trousers-wide-style.jpg',
  };
  const catMap = {
    'photo-1507003211169-0a1dd7228f2d': 'cat-men.jpg',
    'photo-1487412720507-e7ab37603c6f': 'cat-women.jpg',
    'photo-1521572163474-6864f9cf17ab': 'cat-tshirts.jpg',
    'photo-1596755094514-f87e34085b2c': 'cat-shirts.jpg',
    'photo-1542272604-787c3835535d': 'cat-jeans.jpg',
    'photo-1595777457583-95e059d581b8': 'cat-dresses.jpg',
    'photo-1523170335258-f5ed11844a49': 'cat-accessories.jpg',
    'photo-1551028719-00167b16eac5': 'cat-outerwear.jpg',
  };

  try {
    const images = db.prepare('SELECT id, url FROM product_images WHERE url LIKE "%unsplash%"').all();
    const updateImg = db.prepare('UPDATE product_images SET url = ? WHERE id = ?');
    for (const img of images) {
      for (const [key, file] of Object.entries(urlMap)) {
        if (img.url.includes(key)) {
          updateImg.run(`/storage/products/${file}`, img.id);
          break;
        }
      }
    }

    const cats = db.prepare('SELECT id, image FROM categories WHERE image LIKE "%unsplash%"').all();
    const updateCat = db.prepare('UPDATE categories SET image = ? WHERE id = ?');
    for (const cat of cats) {
      for (const [key, file] of Object.entries(catMap)) {
        if (cat.image.includes(key)) {
          updateCat.run(`/storage/products/${file}`, cat.id);
          break;
        }
      }
    }
  } catch (e) {
    // Table might not exist yet during first run
  }
}

function createTables(db) {
  db.exec(`
    -- ══════════════════════════════════════════
    -- Users (customers + admins)
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      is_blocked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ══════════════════════════════════════════
    -- Categories
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      parent_id INTEGER DEFAULT NULL,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    -- ══════════════════════════════════════════
    -- Collections
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ══════════════════════════════════════════
    -- Brands
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ══════════════════════════════════════════
    -- Products
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      compare_at_price REAL DEFAULT NULL,
      category_id INTEGER,
      collection_id INTEGER DEFAULT NULL,
      brand_id INTEGER DEFAULT NULL,
      sku TEXT DEFAULT '',
      stock INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      is_featured INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      hide_when_out_of_stock INTEGER DEFAULT 0,
      continue_selling INTEGER DEFAULT 0,
      meta_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
    );

    -- ══════════════════════════════════════════
    -- Product Images
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      alt_text TEXT DEFAULT '',
      position INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- ══════════════════════════════════════════
    -- Product Variants
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'size',
      value TEXT NOT NULL,
      price_modifier REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      sku TEXT DEFAULT '',
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- ══════════════════════════════════════════
    -- Orders
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      order_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned','refunded')),
      subtotal REAL NOT NULL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT '',
      payment_id TEXT DEFAULT '',
      payment_status TEXT DEFAULT 'pending'
        CHECK(payment_status IN ('pending','paid','failed','refunded')),
      shipping_name TEXT DEFAULT '',
      shipping_email TEXT DEFAULT '',
      shipping_phone TEXT DEFAULT '',
      shipping_address TEXT DEFAULT '',
      shipping_city TEXT DEFAULT '',
      shipping_state TEXT DEFAULT '',
      shipping_postal_code TEXT DEFAULT '',
      shipping_country TEXT DEFAULT 'India',
      billing_same_as_shipping INTEGER DEFAULT 1,
      billing_address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      courier_tracking TEXT DEFAULT '',
      coupon_code TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- ══════════════════════════════════════════
    -- Order Items
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      variant_id INTEGER DEFAULT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total REAL NOT NULL,
      image TEXT DEFAULT '',
      variant_info TEXT DEFAULT '',
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    -- ══════════════════════════════════════════
    -- Addresses
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      address_line1 TEXT NOT NULL,
      address_line2 TEXT DEFAULT '',
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT DEFAULT 'India',
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ══════════════════════════════════════════
    -- Coupons
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'percentage' CHECK(type IN ('percentage', 'flat')),
      value REAL NOT NULL DEFAULT 0,
      min_order REAL DEFAULT 0,
      max_discount REAL DEFAULT NULL,
      usage_limit INTEGER DEFAULT NULL,
      used_count INTEGER DEFAULT 0,
      per_customer_limit INTEGER DEFAULT 1,
      expires_at DATETIME DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ══════════════════════════════════════════
    -- Settings (key-value store)
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT DEFAULT '',
      group_name TEXT DEFAULT 'general'
    );

    -- ══════════════════════════════════════════
    -- CMS Pages
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT DEFAULT '',
      meta_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      is_published INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ══════════════════════════════════════════
    -- Payments Log
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      gateway TEXT NOT NULL,
      gateway_order_id TEXT DEFAULT '',
      gateway_payment_id TEXT DEFAULT '',
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'pending',
      raw_response TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    -- ══════════════════════════════════════════
    -- Reviews
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      user_name TEXT DEFAULT '',
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT DEFAULT '',
      is_approved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- ══════════════════════════════════════════
    -- Search Logs (for popular/recent searches)
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS search_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      user_id INTEGER DEFAULT NULL,
      session_id TEXT DEFAULT '',
      results_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ══════════════════════════════════════════
    -- Shipping Rules
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS shipping_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'flat' CHECK(type IN ('flat', 'weight', 'order_value', 'free')),
      value REAL DEFAULT 0,
      min_order_value REAL DEFAULT 0,
      max_order_value REAL DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ══════════════════════════════════════════
    -- Indexes for performance
    -- ══════════════════════════════════════════
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
  `);
}

function seedData(db) {
  // Check if data already exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return;

  console.log('  → Seeding database with initial data...');

  // ── Admin User ──────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
  const adminHash = bcrypt.hashSync(adminPassword, 12);

  db.prepare(`
    INSERT INTO users (email, password_hash, first_name, last_name, role)
    VALUES (?, ?, 'Admin', 'User', 'admin')
  `).run(adminEmail, adminHash);

  // ── Categories ──────────────────────────────
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, image, position)
    VALUES (?, ?, ?, ?, ?)
  `);

  const categories = [
    ['Men', 'men', 'Premium menswear collection', '/storage/products/cat-men.jpg', 1],
    ['Women', 'women', 'Elegant womenswear collection', '/storage/products/cat-women.jpg', 2],
    ['T-Shirts', 't-shirts', 'Casual & graphic tees', '/storage/products/cat-tshirts.jpg', 3],
    ['Shirts', 'shirts', 'Formal & casual shirts', '/storage/products/cat-shirts.jpg', 4],
    ['Jeans', 'jeans', 'Denim & jeans collection', '/storage/products/cat-jeans.jpg', 5],
    ['Dresses', 'dresses', 'Stunning dresses for every occasion', '/storage/products/cat-dresses.jpg', 6],
    ['Accessories', 'accessories', 'Complete your look', '/storage/products/cat-accessories.jpg', 7],
    ['Outerwear', 'outerwear', 'Jackets, coats & more', '/storage/products/cat-outerwear.jpg', 8],
  ];

  categories.forEach(c => insertCategory.run(...c));

  // ── Collections ──────────────────────────────
  const insertCollection = db.prepare(`
    INSERT INTO collections (name, slug, description) VALUES (?, ?, ?)
  `);

  insertCollection.run('Summer 2026', 'summer-2026', 'Our latest summer collection');
  insertCollection.run('Winter Essentials', 'winter-essentials', 'Stay warm in style');
  insertCollection.run('Everyday Basics', 'everyday-basics', 'Wardrobe staples for every day');

  // ── Products ──────────────────────────────
  const insertProduct = db.prepare(`
    INSERT INTO products (title, slug, description, price, compare_at_price, category_id, collection_id, sku, stock, is_featured, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, url, alt_text, position, is_primary)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (product_id, name, type, value, stock)
    VALUES (?, ?, ?, ?, ?)
  `);

  const products = [
    {
      title: 'Essential Cotton Crew Tee',
      slug: 'essential-cotton-crew-tee',
      description: 'Crafted from 100% premium organic cotton, this crew neck tee offers unmatched softness and a relaxed fit. Perfect for layering or wearing on its own. Features reinforced shoulder seams and a tagless interior for all-day comfort.',
      price: 1299,
      compare_at_price: 1799,
      category_id: 3,
      collection_id: 3,
      sku: 'TEE-001',
      stock: 150,
      is_featured: 1,
      tags: 'cotton,casual,everyday,bestseller',
      images: [
        ['/storage/products/tee-crew-front.jpg', 'White cotton crew tee front', 0, 1],
        ['/storage/products/tee-crew-back.jpg', 'White cotton crew tee back', 1, 0],
      ],
      variants: [['S', 'size', 30], ['M', 'size', 40], ['L', 'size', 40], ['XL', 'size', 25], ['XXL', 'size', 15]],
    },
    {
      title: 'Midnight Black Slim Jeans',
      slug: 'midnight-black-slim-jeans',
      description: 'These slim-fit jeans in deep midnight black feature premium stretch denim that moves with you. Mid-rise waist, tapered leg, and a modern silhouette make these the perfect foundation for any outfit. Available in comfort stretch fabric.',
      price: 2499,
      compare_at_price: 3299,
      category_id: 5,
      collection_id: 3,
      sku: 'JNS-001',
      stock: 85,
      is_featured: 1,
      tags: 'denim,slim-fit,black,bestseller',
      images: [
        ['/storage/products/jeans-black-front.jpg', 'Black slim jeans', 0, 1],
        ['/storage/products/jeans-black-detail.jpg', 'Black slim jeans detail', 1, 0],
      ],
      variants: [['28', 'size', 15], ['30', 'size', 20], ['32', 'size', 20], ['34', 'size', 15], ['36', 'size', 15]],
    },
    {
      title: 'Oxford Button-Down Shirt',
      slug: 'oxford-button-down-shirt',
      description: 'A timeless oxford cloth button-down in crisp white. Woven from long-staple cotton for a soft hand feel with just enough structure. Featuring a classic collar, chest pocket, and adjustable cuffs. Dress it up or down effortlessly.',
      price: 1999,
      compare_at_price: null,
      category_id: 4,
      collection_id: 3,
      sku: 'SHT-001',
      stock: 70,
      is_featured: 1,
      tags: 'formal,oxford,white,classic',
      images: [
        ['/storage/products/shirt-oxford-front.jpg', 'White oxford shirt', 0, 1],
        ['/storage/products/shirt-oxford-detail.jpg', 'White oxford shirt collar detail', 1, 0],
      ],
      variants: [['S', 'size', 15], ['M', 'size', 20], ['L', 'size', 20], ['XL', 'size', 10], ['XXL', 'size', 5]],
    },
    {
      title: 'Relaxed Linen Dress',
      slug: 'relaxed-linen-dress',
      description: 'Effortlessly elegant, this relaxed-fit linen dress is your go-to for warm-weather style. Made from breathable European flax linen with a gently gathered waist, pockets, and a midi-length hem. Available in natural tones.',
      price: 3499,
      compare_at_price: 4299,
      category_id: 6,
      collection_id: 1,
      sku: 'DRS-001',
      stock: 45,
      is_featured: 1,
      tags: 'linen,summer,dress,elegant',
      images: [
        ['/storage/products/dress-linen-front.jpg', 'Linen dress', 0, 1],
        ['/storage/products/dress-linen-side.jpg', 'Linen dress side view', 1, 0],
      ],
      variants: [['XS', 'size', 8], ['S', 'size', 12], ['M', 'size', 12], ['L', 'size', 8], ['XL', 'size', 5]],
    },
    {
      title: 'Oversized Graphic Tee — Wave',
      slug: 'oversized-graphic-tee-wave',
      description: 'Make a statement with our oversized graphic tee featuring an original wave print. 240GSM heavyweight cotton ensures a premium drape. Drop shoulders and a boxy cut for that effortlessly cool look.',
      price: 1599,
      compare_at_price: 2199,
      category_id: 3,
      collection_id: 1,
      sku: 'TEE-002',
      stock: 100,
      is_featured: 0,
      tags: 'graphic,oversized,streetwear,summer',
      images: [
        ['/storage/products/tee-graphic-front.jpg', 'Oversized graphic tee', 0, 1],
        ['/storage/products/tee-graphic-back.jpg', 'Graphic tee back view', 1, 0],
      ],
      variants: [['M', 'size', 25], ['L', 'size', 35], ['XL', 'size', 25], ['XXL', 'size', 15]],
    },
    {
      title: 'Tailored Chino Trousers',
      slug: 'tailored-chino-trousers',
      description: 'Versatile tailored chinos in a refined slim-tapered fit. Made from garment-dyed stretch cotton twill for a soft, lived-in feel from day one. Perfect for smart-casual occasions with a polished silhouette.',
      price: 2199,
      compare_at_price: 2799,
      category_id: 5,
      collection_id: 3,
      sku: 'CHN-001',
      stock: 60,
      is_featured: 0,
      tags: 'chino,tailored,smart-casual',
      images: [
        ['/storage/products/chino-front.jpg', 'Tailored chinos', 0, 1],
        ['/storage/products/chino-detail.jpg', 'Chinos detail', 1, 0],
      ],
      variants: [['28', 'size', 10], ['30', 'size', 15], ['32', 'size', 15], ['34', 'size', 10], ['36', 'size', 10]],
    },
    {
      title: 'Quilted Bomber Jacket',
      slug: 'quilted-bomber-jacket',
      description: 'A modern take on the classic bomber. Features diamond quilting, ribbed cuffs and hem, and a satin-finish shell. Lined with soft polar fleece for warmth without bulk. Two-way zip for versatile styling.',
      price: 4999,
      compare_at_price: 6499,
      category_id: 8,
      collection_id: 2,
      sku: 'JKT-001',
      stock: 30,
      is_featured: 1,
      tags: 'bomber,jacket,winter,premium',
      images: [
        ['/storage/products/jacket-bomber-front.jpg', 'Quilted bomber jacket', 0, 1],
        ['/storage/products/jacket-bomber-back.jpg', 'Bomber jacket back', 1, 0],
      ],
      variants: [['S', 'size', 5], ['M', 'size', 10], ['L', 'size', 8], ['XL', 'size', 5], ['XXL', 'size', 2]],
    },
    {
      title: 'Classic Leather Watch',
      slug: 'classic-leather-watch',
      description: 'Minimalist analog watch with a genuine leather strap and brushed stainless steel case. Japanese quartz movement for precise timekeeping. Water resistant to 30m. The perfect finishing touch to any outfit.',
      price: 3999,
      compare_at_price: 5499,
      category_id: 7,
      collection_id: null,
      sku: 'ACC-001',
      stock: 25,
      is_featured: 0,
      tags: 'watch,leather,accessory,minimal',
      images: [
        ['/storage/products/watch-leather-front.jpg', 'Leather watch', 0, 1],
        ['/storage/products/watch-leather-detail.jpg', 'Watch detail', 1, 0],
      ],
      variants: [],
    },
    {
      title: 'Floral Wrap Blouse',
      slug: 'floral-wrap-blouse',
      description: 'A romantic floral print on lightweight viscose fabric. This wrap-style blouse features a V-neckline, flutter sleeves, and an adjustable tie waist. Pair with high-waisted trousers for a polished look.',
      price: 1799,
      compare_at_price: null,
      category_id: 4,
      collection_id: 1,
      sku: 'BLS-001',
      stock: 55,
      is_featured: 0,
      tags: 'floral,blouse,women,summer',
      images: [
        ['/storage/products/blouse-floral-front.jpg', 'Floral wrap blouse', 0, 1],
        ['/storage/products/blouse-floral-style.jpg', 'Blouse styling', 1, 0],
      ],
      variants: [['XS', 'size', 10], ['S', 'size', 15], ['M', 'size', 15], ['L', 'size', 10], ['XL', 'size', 5]],
    },
    {
      title: 'Minimal Canvas Sneakers',
      slug: 'minimal-canvas-sneakers',
      description: 'Clean, minimal canvas sneakers in off-white. Vulcanized rubber sole for flexibility, organic cotton upper, and minimal branding for a versatile, go-with-everything silhouette.',
      price: 2799,
      compare_at_price: 3499,
      category_id: 7,
      collection_id: 3,
      sku: 'ACC-002',
      stock: 40,
      is_featured: 1,
      tags: 'sneakers,minimal,canvas,everyday',
      images: [
        ['/storage/products/sneakers-canvas-front.jpg', 'Canvas sneakers', 0, 1],
        ['/storage/products/sneakers-canvas-side.jpg', 'Sneakers side view', 1, 0],
      ],
      variants: [['7', 'size', 5], ['8', 'size', 8], ['9', 'size', 10], ['10', 'size', 10], ['11', 'size', 5], ['12', 'size', 2]],
    },
    {
      title: 'Merino Wool Pullover',
      slug: 'merino-wool-pullover',
      description: 'Ultra-fine merino wool pullover in charcoal grey. Naturally temperature-regulating, breathable, and pill-resistant. Ribbed cuffs and hem, crew neckline, and a regular fit that works tucked or untucked.',
      price: 3299,
      compare_at_price: 4199,
      category_id: 8,
      collection_id: 2,
      sku: 'KNT-001',
      stock: 35,
      is_featured: 0,
      tags: 'merino,wool,winter,premium',
      images: [
        ['/storage/products/pullover-merino-front.jpg', 'Merino pullover', 0, 1],
        ['/storage/products/pullover-merino-detail.jpg', 'Pullover texture', 1, 0],
      ],
      variants: [['S', 'size', 7], ['M', 'size', 10], ['L', 'size', 10], ['XL', 'size', 5], ['XXL', 'size', 3]],
    },
    {
      title: 'High-Rise Wide Leg Trousers',
      slug: 'high-rise-wide-leg-trousers',
      description: 'Elevated wide-leg trousers with a high-rise waist for a flattering, elongated silhouette. Made from structured crepe fabric that drapes beautifully. Front pleats and side pockets for a refined look.',
      price: 2699,
      compare_at_price: null,
      category_id: 5,
      collection_id: 1,
      sku: 'TRS-001',
      stock: 40,
      is_featured: 0,
      tags: 'wide-leg,trousers,women,elegant',
      images: [
        ['/storage/products/trousers-wide-front.jpg', 'Wide leg trousers', 0, 1],
        ['/storage/products/trousers-wide-style.jpg', 'Trousers styling', 1, 0],
      ],
      variants: [['XS', 'size', 6], ['S', 'size', 10], ['M', 'size', 12], ['L', 'size', 8], ['XL', 'size', 4]],
    },
  ];

  const insertProductTransaction = db.transaction(() => {
    for (const p of products) {
      const result = insertProduct.run(
        p.title, p.slug, p.description, p.price, p.compare_at_price,
        p.category_id, p.collection_id, p.sku, p.stock, p.is_featured, p.tags
      );
      const productId = result.lastInsertRowid;

      for (const img of p.images) {
        insertImage.run(productId, img[0], img[1], img[2], img[3]);
      }

      for (const v of p.variants) {
        insertVariant.run(productId, v[0], v[1], v[0], v[2]);
      }
    }
  });

  insertProductTransaction();

  // ── Default Settings ──────────────────────────
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, group_name) VALUES (?, ?, ?)
  `);

  const defaultSettings = [
    ['site_name', 'SANHI', 'general'],
    ['site_subtitle', 'Premium Clothing', 'general'],
    ['contact_email', 'contact@example.com', 'general'],
    ['contact_phone', '+1 555 000 0000', 'general'],
    ['address', '123 Main St, City, Country', 'general'],
    ['currency', 'INR', 'general'],
    ['currency_symbol', '₹', 'general'],

    ['facebook_url', 'https://facebook.com/example', 'social'],
    ['instagram_url', 'https://instagram.com/example', 'social'],
    ['twitter_url', 'https://twitter.com/example', 'social'],
    ['youtube_url', '', 'social'],
    ['pinterest_url', '', 'social'],

    ['meta_title', 'SANHI — Premium Clothing', 'seo'],
    ['meta_description', 'Shop premium quality clothing at SANHI. Modern designs, sustainable fabrics, and timeless style.', 'seo'],
    ['analytics_code', '', 'seo'],

    ['theme_preset', 'black-white', 'theme'],
    ['color_background', '#FFFFFF', 'theme'],
    ['color_text', '#111111', 'theme'],
    ['color_primary', '#000000', 'theme'],
    ['color_secondary', '#4A4A4A', 'theme'],
    ['color_accent', '#000000', 'theme'],
    ['color_button', '#000000', 'theme'],
    ['color_border', '#E5E5E5', 'theme'],
    ['color_success', '#1E7E34', 'theme'],
    ['color_warning', '#B8860B', 'theme'],
    ['color_danger', '#C1121F', 'theme'],

    ['maintenance_mode', '0', 'general'],
    ['free_shipping_threshold', '2000', 'shipping'],
    ['default_shipping_cost', '99', 'shipping'],

    ['razorpay_enabled', '0', 'payment'],
    ['cashfree_enabled', '0', 'payment'],
    ['phonepe_enabled', '0', 'payment'],
    ['cod_enabled', '1', 'payment'],
    ['cod_min_order', '0', 'payment'],
    ['cod_max_order', '10000', 'payment'],
    ['cod_charge', '0', 'payment'],
  ];

  defaultSettings.forEach(s => insertSetting.run(...s));

  // ── Default Static Pages ──────────────────────
  const insertPage = db.prepare(`
    INSERT OR IGNORE INTO pages (title, slug, content, is_published) VALUES (?, ?, ?, 1)
  `);

  insertPage.run('About Us', 'about', '<h2>About SANHI</h2><p>We believe in premium quality clothing that does not compromise on style or sustainability. Our collections are designed for the modern individual who values timeless design and exceptional craftsmanship.</p>');
  insertPage.run('Privacy Policy', 'privacy-policy', '<h2>Privacy Policy</h2><p>Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.</p>');
  insertPage.run('Terms & Conditions', 'terms-and-conditions', '<h2>Terms & Conditions</h2><p>By using our website, you agree to these terms and conditions. Please read them carefully.</p>');
  insertPage.run('Refund Policy', 'refund-policy', '<h2>Refund Policy</h2><p>We offer hassle-free returns within 7 days of delivery. Items must be in original condition with tags attached.</p>');
  insertPage.run('Shipping Policy', 'shipping-policy', '<h2>Shipping Policy</h2><p>Free shipping on orders above ₹2,000. Standard delivery takes 5-7 business days across India.</p>');
  insertPage.run('Contact', 'contact', '<h2>Contact Us</h2><p>Have a question? Reach out to us at contact@example.com or call us at +1 555 000 0000.</p>');

  // ── Sample Reviews ──────────────────────────
  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, user_name, rating, comment, is_approved)
    VALUES (?, ?, ?, ?, 1)
  `);

  const sampleReviews = [
    [1, 'Priya M.', 5, 'Incredibly soft cotton tee. The fit is perfect and it holds up beautifully after multiple washes. Will definitely buy more colors!'],
    [1, 'Arjun K.', 4, 'Great quality for the price. Slightly longer than expected but I like the look. The fabric breathes well in Mumbai heat.'],
    [2, 'Rahul S.', 5, 'Best jeans I have owned. The stretch is perfect — comfortable all day at work. The black color stays rich even after washing.'],
    [3, 'Sneha P.', 5, 'Classic oxford that goes with everything. The quality is noticeably premium. Perfect for both office and casual weekend looks.'],
    [4, 'Ananya R.', 4, 'Beautiful linen dress! So comfortable in summer. The only reason for 4 stars is that it wrinkles easily, but that is the nature of linen.'],
    [7, 'Vikram D.', 5, 'This bomber jacket is absolutely stunning. The quilting gives it structure without being too heavy. Gets compliments every time I wear it.'],
    [10, 'Neha T.', 5, 'Cleanest sneakers I own. The minimal design pairs with literally everything. Super comfortable for walking around the city all day.'],
    [3, 'Deepak L.', 4, 'Excellent shirt. The fabric is substantial but not too thick. Perfect for layering or wearing on its own. True to size.'],
  ];

  sampleReviews.forEach(r => insertReview.run(...r));

  // ── Coupons ──────────────────────────────
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, type, value, min_order, max_discount, usage_limit, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertCoupon.run('WELCOME10', 'percentage', 10, 999, 500, 1000);
  insertCoupon.run('FLAT200', 'flat', 200, 1499, null, 500);

  // ── Shipping Rules ──────────────────────────
  const insertShipping = db.prepare(`
    INSERT INTO shipping_rules (name, type, value, min_order_value, is_active) VALUES (?, ?, ?, ?, 1)
  `);

  insertShipping.run('Standard Shipping', 'flat', 99, 0);
  insertShipping.run('Free Shipping', 'free', 0, 2000);

  console.log('  ✓ Database seeded successfully');
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..', '..');
const dbPath = path.join(projectRoot, 'database', 'shop.db');
const storageProductsDir = path.join(projectRoot, 'storage', 'products');

const sourceBaseDir = process.env.SANHI_IMPORT_DIR || path.join(projectRoot, 'import_data', 'sanhi_clean');
const metadataDir = path.join(sourceBaseDir, 'metadata');
const imagesBaseDir = path.join(sourceBaseDir, 'images');

// Ensure database and storage directories exist
if (!fs.existsSync(dbPath)) {
  console.error(`[Import] Database file not found at: ${dbPath}`);
  process.exit(1);
}

if (!fs.existsSync(storageProductsDir)) {
  fs.mkdirSync(storageProductsDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

console.log('🚀 Starting import from:', sourceBaseDir);

const metadataFiles = ['men-shirts.json', 'dresses.json', 'jeans.json', 'tops.json'];

const upsertCategory = db.prepare(`
  INSERT INTO categories (name, slug, description, image, position)
  VALUES (?, ?, ?, ?, 0)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    description = excluded.description,
    image = CASE WHEN excluded.image != '' THEN excluded.image ELSE categories.image END
`);

const getCategoryBySlug = db.prepare(`SELECT id FROM categories WHERE slug = ?`);

const upsertProduct = db.prepare(`
  INSERT INTO products (
    title, slug, description, price, compare_at_price, category_id, sku, stock, is_featured, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
  ON CONFLICT(slug) DO UPDATE SET
    title = excluded.title,
    description = excluded.description,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    category_id = excluded.category_id,
    sku = excluded.sku,
    stock = excluded.stock,
    is_featured = 1,
    is_active = 1
`);

const getProductBySlug = db.prepare(`SELECT id FROM products WHERE slug = ?`);

const clearProductImages = db.prepare(`DELETE FROM product_images WHERE product_id = ?`);
const insertProductImage = db.prepare(`
  INSERT INTO product_images (product_id, url, alt_text, position, is_primary)
  VALUES (?, ?, ?, ?, ?)
`);

const clearProductVariants = db.prepare(`DELETE FROM product_variants WHERE product_id = ?`);
const insertProductVariant = db.prepare(`
  INSERT INTO product_variants (product_id, name, type, value, stock, sku)
  VALUES (?, ?, ?, ?, ?, ?)
`);

let totalImportedProducts = 0;
let totalImportedCategories = 0;

for (const file of metadataFiles) {
  const filePath = path.join(metadataDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[Import] Metadata file missing: ${filePath}`);
    continue;
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);

  const categoryName = data.category;
  const categoryHandle = data.handle || slugify(categoryName);
  const products = data.products || [];

  console.log(`\n📁 Processing Category: ${categoryName} (${categoryHandle}) — ${products.length} products`);

  // First pass: Copy first image for category thumbnail
  let categoryImageUrl = '';
  if (products.length > 0 && products[0].image) {
    const firstImgName = products[0].image;
    const srcImgPath = path.join(imagesBaseDir, categoryHandle, firstImgName);
    const destImgPath = path.join(storageProductsDir, firstImgName);

    if (fs.existsSync(srcImgPath)) {
      fs.copyFileSync(srcImgPath, destImgPath);
      categoryImageUrl = `/storage/products/${firstImgName}`;
    }
  }

  // Insert or Update Category
  upsertCategory.run(categoryName, categoryHandle, `Premium ${categoryName} collection by SANHI`, categoryImageUrl);
  const catRow = getCategoryBySlug.get(categoryHandle);
  const categoryId = catRow.id;
  totalImportedCategories++;

  // Process Products
  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    const productTitle = p.title;
    const productSlug = slugify(productTitle);
    const productDesc = p.description || '';
    const productPrice = p.price || 0;
    const compareAtPrice = productPrice > 0 ? Math.round(productPrice * 1.15) : null;
    const skuPrefix = categoryHandle.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'PRD';
    const productSku = `SANHI-${skuPrefix}-${String(idx + 1).padStart(3, '0')}`;
    const imageName = p.image;

    // Copy Product Image
    let imageUrl = '';
    if (imageName) {
      const srcImgPath = path.join(imagesBaseDir, categoryHandle, imageName);
      const destImgPath = path.join(storageProductsDir, imageName);

      if (fs.existsSync(srcImgPath)) {
        fs.copyFileSync(srcImgPath, destImgPath);
        imageUrl = `/storage/products/${imageName}`;
        console.log(`  ✓ Copied image: ${imageName}`);
      } else {
        console.warn(`  ⚠️ Image file not found: ${srcImgPath}`);
      }
    }

    // Insert or Update Product
    upsertProduct.run(
      productTitle,
      productSlug,
      productDesc,
      productPrice,
      compareAtPrice,
      categoryId,
      productSku,
      60,
    );

    const prodRow = getProductBySlug.get(productSlug);
    const productId = prodRow.id;

    // Insert Product Image
    if (imageUrl) {
      clearProductImages.run(productId);
      insertProductImage.run(productId, imageUrl, productTitle, 0, 1);
    }

    // Insert Product Size Variants
    const sizes = p.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    clearProductVariants.run(productId);
    for (const sz of sizes) {
      insertProductVariant.run(
        productId,
        `Size ${sz}`,
        'size',
        sz,
        10,
        `${productSku}-${sz}`
      );
    }

    totalImportedProducts++;
    console.log(`  ✅ Imported Product: ${productTitle} (${productSlug}) — ₹${productPrice}`);
  }
}

console.log(`\n🎉 Import Complete!`);
console.log(`   Total Categories: ${totalImportedCategories}`);
console.log(`   Total Products: ${totalImportedProducts}`);

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..', '..');
const dbPath = path.join(projectRoot, 'database', 'shop.db');
const storageProductsDir = path.join(projectRoot, 'storage', 'products');

if (!fs.existsSync(storageProductsDir)) {
  fs.mkdirSync(storageProductsDir, { recursive: true });
}

const db = new Database(dbPath);

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: status ${response.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
    request.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('🚀 Downloading external images locally...');

  // 1. Process Product Images
  const productImages = db.prepare("SELECT id, product_id, url FROM product_images WHERE url LIKE 'http%'").all();
  console.log(`Found ${productImages.length} external product images.`);

  const updateProductImage = db.prepare('UPDATE product_images SET url = ? WHERE id = ?');

  for (let i = 0; i < productImages.length; i++) {
    const img = productImages[i];
    const filename = `product-${img.product_id}-${img.id}.jpg`;
    const localPath = path.join(storageProductsDir, filename);
    const localUrl = `/storage/products/${filename}`;

    try {
      console.log(`[ProductImg ${img.id}] Downloading ${img.url} -> ${filename}...`);
      await downloadFile(img.url, localPath);
      updateProductImage.run(localUrl, img.id);
      console.log(`  ✓ Updated database to ${localUrl}`);
    } catch (err) {
      console.error(`  ❌ Failed for product image ${img.id}:`, err.message);
    }
  }

  // 2. Process Category Images
  const categories = db.prepare("SELECT id, name, image FROM categories WHERE image LIKE 'http%'").all();
  console.log(`Found ${categories.length} external category images.`);

  const updateCategory = db.prepare('UPDATE categories SET image = ? WHERE id = ?');

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const filename = `category-${cat.id}.jpg`;
    const localPath = path.join(storageProductsDir, filename);
    const localUrl = `/storage/products/${filename}`;

    try {
      console.log(`[Category ${cat.id}] Downloading ${cat.image} -> ${filename}...`);
      await downloadFile(cat.image, localPath);
      updateCategory.run(localUrl, cat.id);
      console.log(`  ✓ Updated database to ${localUrl}`);
    } catch (err) {
      console.error(`  ❌ Failed for category ${cat.id}:`, err.message);
    }
  }

  console.log('\n🎉 All external images downloaded and updated to local paths!');
}

main().catch(console.error);

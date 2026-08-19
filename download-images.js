import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_DIR = path.join(__dirname, 'storage', 'products');

if (!fs.existsSync(PRODUCTS_DIR)) {
  fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
}

const IMAGES = [
  // Products
  { file: 'tee-crew-front.jpg', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop' },
  { file: 'tee-crew-back.jpg', url: 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800&h=1000&fit=crop' },
  { file: 'jeans-black-front.jpg', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1000&fit=crop' },
  { file: 'jeans-black-detail.jpg', url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=1000&fit=crop' },
  { file: 'shirt-oxford-front.jpg', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop' },
  { file: 'shirt-oxford-detail.jpg', url: 'https://images.unsplash.com/photo-1598032895455-1b82f8a4f510?w=800&h=1000&fit=crop' },
  { file: 'dress-linen-front.jpg', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop' },
  { file: 'dress-linen-side.jpg', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1000&fit=crop' },
  { file: 'tee-graphic-front.jpg', url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=1000&fit=crop' },
  { file: 'tee-graphic-back.jpg', url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop' },
  { file: 'chino-front.jpg', url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1000&fit=crop' },
  { file: 'chino-detail.jpg', url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=1000&fit=crop' },
  { file: 'jacket-bomber-front.jpg', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop' },
  { file: 'jacket-bomber-back.jpg', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop' },
  { file: 'watch-leather-front.jpg', url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=1000&fit=crop' },
  { file: 'watch-leather-detail.jpg', url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=1000&fit=crop' },
  { file: 'blouse-floral-front.jpg', url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&h=1000&fit=crop' },
  { file: 'blouse-floral-style.jpg', url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&h=1000&fit=crop' },
  { file: 'sneakers-canvas-front.jpg', url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=1000&fit=crop' },
  { file: 'sneakers-canvas-side.jpg', url: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=1000&fit=crop' },
  { file: 'pullover-merino-front.jpg', url: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=800&h=1000&fit=crop' },
  { file: 'pullover-merino-detail.jpg', url: 'https://images.unsplash.com/photo-1614975059251-992f11792571?w=800&h=1000&fit=crop' },
  { file: 'trousers-wide-front.jpg', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=1000&fit=crop' },
  { file: 'trousers-wide-style.jpg', url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=1000&fit=crop' },
  // Categories
  { file: 'cat-men.jpg', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop' },
  { file: 'cat-women.jpg', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=400&fit=crop' },
  { file: 'cat-tshirts.jpg', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=400&fit=crop' },
  { file: 'cat-shirts.jpg', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=400&fit=crop' },
  { file: 'cat-jeans.jpg', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=400&fit=crop' },
  { file: 'cat-dresses.jpg', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=400&fit=crop' },
  { file: 'cat-accessories.jpg', url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=400&fit=crop' },
  { file: 'cat-outerwear.jpg', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=400&fit=crop' },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log(`Downloading ${IMAGES.length} images...`);
  let done = 0;
  for (const img of IMAGES) {
    const dest = path.join(PRODUCTS_DIR, img.file);
    if (fs.existsSync(dest)) {
      done++;
      continue;
    }
    try {
      await downloadFile(img.url, dest);
      done++;
      console.log(`  [${done}/${IMAGES.length}] ${img.file}`);
    } catch (err) {
      console.error(`  FAILED: ${img.file} - ${err.message}`);
    }
  }
  console.log(`\nDone! ${done}/${IMAGES.length} images in storage/products/`);
}

main();
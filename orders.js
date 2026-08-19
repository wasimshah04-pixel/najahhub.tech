import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SNH-${dateStr}-${randomSuffix}`;
}

// POST /api/orders — Create new order (supports Guest Checkout with Auto Account Creation)
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const {
      customer,
      shippingAddress,
      billingAddress,
      items,
      paymentMethod = 'cod',
      couponCode = '',
      discount = 0,
      notes = '',
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!customer || !customer.email || !customer.name || !customer.phone) {
      return res.status(400).json({ error: 'Customer contact details are required' });
    }

    if (!shippingAddress || !shippingAddress.address_line1 || !shippingAddress.city || !shippingAddress.postal_code) {
      return res.status(400).json({ error: 'Complete shipping address is required' });
    }

    let userId = null;
    let autoCreatedAccount = false;
    let authHeader = req.headers['authorization'];
    let token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

    // Check if user is logged in
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Token invalid, proceed as guest
      }
    }

    // Guest checkout → auto create account if user doesn't exist
    if (!userId) {
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(customer.email.toLowerCase().trim());
      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Auto-create customer account without OTP
        const nameParts = customer.name.trim().split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';
        const defaultPassword = customer.password || crypto.randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(defaultPassword, 12);

        const newAccount = db.prepare(`
          INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
          VALUES (?, ?, ?, ?, ?, 'customer')
        `).run(customer.email.toLowerCase().trim(), passwordHash, firstName, lastName, customer.phone);

        userId = newAccount.lastInsertRowid;
        autoCreatedAccount = true;
      }
    }

    // Calculate subtotal
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT id, title, price, stock FROM products WHERE id = ?').get(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ID ${item.productId} not found` });
      }

      const itemPrice = product.price;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: product.id,
        variant_id: item.variantId || null,
        title: product.title,
        price: itemPrice,
        quantity: item.quantity,
        total: itemTotal,
        image: item.image || '',
        variant_info: item.variantLabel || '',
      });
    }

    // Shipping Cost Rule (Free shipping over ₹2000 or flat ₹99)
    const freeShippingThreshold = parseFloat(db.prepare("SELECT value FROM settings WHERE key = 'free_shipping_threshold'").get()?.value || '2000');
    const defaultShippingCost = parseFloat(db.prepare("SELECT value FROM settings WHERE key = 'default_shipping_cost'").get()?.value || '99');
    const shippingCost = subtotal >= freeShippingThreshold ? 0 : defaultShippingCost;

    const total = Math.max(0, subtotal + shippingCost - discount);
    const orderNumber = generateOrderNumber();

    // Create Order Transaction
    const createOrderTx = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (
          user_id, order_number, status, subtotal, shipping_cost, discount, tax, total,
          payment_method, payment_status, shipping_name, shipping_email, shipping_phone,
          shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country,
          notes, coupon_code
        ) VALUES (
          ?, ?, 'pending', ?, ?, ?, 0, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?
        )
      `).run(
        userId, orderNumber, subtotal, shippingCost, discount, total,
        paymentMethod, paymentMethod === 'cod' ? 'pending' : 'pending',
        customer.name, customer.email, customer.phone,
        shippingAddress.address_line1 + (shippingAddress.address_line2 ? `, ${shippingAddress.address_line2}` : ''),
        shippingAddress.city, shippingAddress.state || '', shippingAddress.postal_code, shippingAddress.country || 'India',
        notes, couponCode
      );

      const orderId = orderResult.lastInsertRowid;

      // Insert Items & Update Stock
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, variant_id, title, price, quantity, total, image, variant_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStock = db.prepare(`
        UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
      `);

      for (const vi of validatedItems) {
        insertItem.run(orderId, vi.product_id, vi.variant_id, vi.title, vi.price, vi.quantity, vi.total, vi.image, vi.variant_info);
        updateStock.run(vi.quantity, vi.product_id);
      }

      // Update coupon usage if applied
      if (couponCode) {
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER(?)').run(couponCode);
      }

      return orderId;
    });

    const orderId = createOrderTx();

    // Issue JWT token if guest account was created
    let userToken = null;
    if (autoCreatedAccount) {
      userToken = jwt.sign(
        { id: userId, email: customer.email, role: 'customer', first_name: customer.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.cookie('token', userToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    res.json({
      message: 'Order created successfully',
      orderId,
      orderNumber,
      total,
      paymentMethod,
      autoCreatedAccount,
      token: userToken,
    });
  } catch (err) {
    console.error('[Orders] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/my-orders — Get current customer's order history
router.get('/my-orders', authenticateToken, (req, res) => {
  try {
    const db = req.app.get('db');
    const orders = db.prepare(`
      SELECT o.id, o.order_number, o.status, o.total, o.payment_method, o.payment_status, o.created_at,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
             (SELECT image FROM order_items WHERE order_id = o.id LIMIT 1) as first_item_image
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    res.json({ orders });
  } catch (err) {
    console.error('[Orders] My orders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// GET /api/orders/:orderNumber — Single order detail with items & status timeline
router.get('/:orderNumber', (req, res) => {
  try {
    const db = req.app.get('db');
    const order = db.prepare(`
      SELECT * FROM orders WHERE order_number = ?
    `).get(req.params.orderNumber);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).all(order.id);

    // Status Timeline definition
    const statuses = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentStatusIndex = statuses.indexOf(order.status);

    res.json({
      order: {
        ...order,
        items,
        timeline: statuses.map((st, i) => ({
          status: st,
          label: st.replace(/_/g, ' ').toUpperCase(),
          completed: i <= currentStatusIndex && currentStatusIndex !== -1,
          current: st === order.status,
        })),
      },
    });
  } catch (err) {
    console.error('[Orders] Detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;

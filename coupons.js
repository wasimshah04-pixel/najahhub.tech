import { Router } from 'express';

const router = Router();

// POST /api/coupons/apply
router.post('/apply', (req, res) => {
  try {
    const db = req.app.get('db');
    const { code, subtotal } = req.body;

    if (!code || !subtotal) {
      return res.status(400).json({ error: 'Coupon code and subtotal are required' });
    }

    const coupon = db.prepare(`
      SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1
    `).get(code.trim());

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    if (subtotal < coupon.min_order) {
      return res.status(400).json({
        error: `Minimum order value for this coupon is ₹${coupon.min_order}`,
      });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else if (coupon.type === 'flat') {
      discount = coupon.value;
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);

    res.json({
      message: 'Coupon applied successfully',
      code: coupon.code,
      discount: Math.round(discount),
      type: coupon.type,
      value: coupon.value,
    });
  } catch (err) {
    console.error('[Coupons] Apply error:', err.message);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
});

export default router;

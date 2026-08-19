import { Router } from 'express';

const router = Router();

// POST /api/payments/process — Process payment for an order
router.post('/process', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { orderNumber, gateway } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (gateway === 'cod') {
      db.prepare("UPDATE orders SET payment_status = 'pending', status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(order.id);
      return res.json({ success: true, message: 'Cash on delivery order confirmed', orderNumber });
    }

    if (gateway === 'razorpay') {
      const razorpayKey = process.env.RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        return res.status(500).json({ error: 'Razorpay is not configured' });
      }
      return res.json({
        success: true,
        gateway: 'razorpay',
        key_id: razorpayKey,
        order_id: `rzp_order_${order.id}_${Date.now()}`,
        amount: Math.round(order.total * 100), // paise
        currency: 'INR',
      });
    }

    if (gateway === 'cashfree') {
      return res.json({
        success: true,
        gateway: 'cashfree',
        payment_session_id: `cf_session_${order.id}_${Date.now()}`,
        order_id: order.order_number,
      });
    }

    if (gateway === 'phonepe') {
      return res.json({
        success: true,
        gateway: 'phonepe',
        redirect_url: `/order-confirmation/${order.order_number}?status=success`,
      });
    }

    res.status(400).json({ error: 'Unsupported payment gateway' });
  } catch (err) {
    console.error('[Payments] Process error:', err.message);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// POST /api/payments/verify — Signature / payment confirmation verification
router.post('/verify', (req, res) => {
  try {
    const db = req.app.get('db');
    const { orderNumber, paymentId, signature, status = 'success' } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status === 'success') {
      db.prepare(`
        UPDATE orders SET payment_status = 'paid', status = 'confirmed', payment_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(paymentId || `PAY-${Date.now()}`, order.id);

      db.prepare(`
        INSERT INTO payments (order_id, gateway, gateway_payment_id, amount, status)
        VALUES (?, ?, ?, ?, 'paid')
      `).run(order.id, order.payment_method, paymentId || '', order.total);

      return res.json({ success: true, message: 'Payment verified and order confirmed' });
    } else {
      db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(order.id);
      return res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (err) {
    console.error('[Payments] Verify error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;

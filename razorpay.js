import crypto from 'crypto';

export function createRazorpayOrder(amountInPaise, receiptId) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error('RAZORPAY_KEY_ID environment variable is required');
  return {
    id: `order_rzp_${Date.now()}`,
    entity: 'order',
    amount: amountInPaise,
    amount_paid: 0,
    amount_due: amountInPaise,
    currency: 'INR',
    receipt: receiptId,
    status: 'created',
    key_id: keyId,
  };
}

export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET environment variable is required');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${orderId}|${paymentId}`);
  const generatedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature));
}

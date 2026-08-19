export function createPhonePePayRequest(orderNumber, amountInPaise, redirectUrl) {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  if (!merchantId) throw new Error('PHONEPE_MERCHANT_ID environment variable is required');
  return {
    merchantId,
    merchantTransactionId: orderNumber,
    merchantUserId: `usr_${Date.now()}`,
    amount: amountInPaise,
    redirectUrl,
    redirectMode: 'POST',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };
}

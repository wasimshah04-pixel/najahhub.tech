export function createCashfreeOrder(orderNumber, amount, customerDetails) {
  return {
    order_id: orderNumber,
    order_amount: amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: customerDetails.id || `cust_${Date.now()}`,
      customer_email: customerDetails.email,
      customer_phone: customerDetails.phone,
    },
    payment_session_id: `cf_session_${Date.now()}`,
  };
}

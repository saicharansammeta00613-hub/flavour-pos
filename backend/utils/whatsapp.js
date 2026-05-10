const twilio = require('twilio');

let client = null;

// Initialize Twilio client only if credentials are set
const getClient = () => {
  if (!client && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid') {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

const formatPhone = (phone) => {
  // Remove spaces, dashes, brackets
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Add country code if not present
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) cleaned = '+91' + cleaned.slice(1);
    else cleaned = '+91' + cleaned;
  }
  return `whatsapp:${cleaned}`;
};

const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;

// ─── Send Bill to Customer ─────────────────────────────────────────────────────
exports.sendBill = async (order) => {
  const twClient = getClient();
  if (!twClient || !order.customer?.phone) return false;

  const itemsList = order.items
    .map(i => `  • ${i.name} x${i.quantity} — ${formatCurrency(i.total)}`)
    .join('\n');

  const message = `
🍽️ *${process.env.RESTAURANT_NAME || 'FLAVOUR Restaurant'}*
Thank you for dining with us!

*Order #${order.orderNumber}*
Type: ${order.type.replace('_', ' ').toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleString('en-IN')}

*Items:*
${itemsList}

━━━━━━━━━━━━━━━
Subtotal: ${formatCurrency(order.pricing.subtotal)}
CGST (2.5%): ${formatCurrency(order.pricing.cgst)}
SGST (2.5%): ${formatCurrency(order.pricing.sgst)}
${order.pricing.deliveryCharge > 0 ? `Delivery: ${formatCurrency(order.pricing.deliveryCharge)}\n` : ''}${order.pricing.discount > 0 ? `Discount: -${formatCurrency(order.pricing.discount)}\n` : ''}*TOTAL: ${formatCurrency(order.pricing.total)}*
Payment: ${order.payment.method?.toUpperCase() || 'PENDING'}
━━━━━━━━━━━━━━━

Visit us again! 😊
${process.env.RESTAURANT_ADDRESS || ''}
${process.env.RESTAURANT_PHONE || ''}
  `.trim();

  try {
    await twClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formatPhone(order.customer.phone),
      body: message
    });
    return true;
  } catch (err) {
    console.error('WhatsApp bill send error:', err.message);
    return false;
  }
};

// ─── Send Order Confirmation ───────────────────────────────────────────────────
exports.sendOrderConfirmation = async (order) => {
  const twClient = getClient();
  if (!twClient || !order.customer?.phone) return false;

  const message = `
✅ *Order Confirmed!*

Hi ${order.customer.name}! Your order has been received.

*Order #${order.orderNumber}*
${order.type === 'delivery' ? `📍 Delivery to: ${order.customer.address}` : ''}
${order.type === 'pickup' ? '📦 Ready for Pickup in ~20 mins' : ''}

*Items:*
${order.items.map(i => `• ${i.name} x${i.quantity}`).join('\n')}

*Total: ${formatCurrency(order.pricing.total)}*

We'll notify you when your order is ready! 🍽️
  `.trim();

  try {
    await twClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formatPhone(order.customer.phone),
      body: message
    });
    return true;
  } catch (err) {
    console.error('WhatsApp confirmation error:', err.message);
    return false;
  }
};

// ─── Send Reservation Confirmation ────────────────────────────────────────────
exports.sendReservationConfirmation = async (reservation) => {
  const twClient = getClient();
  if (!twClient || !reservation.customer?.phone) return false;

  const message = `
🎉 *Reservation Confirmed!*

Hi ${reservation.customer.name}!

Your table reservation at *${process.env.RESTAURANT_NAME}* is confirmed.

📅 Date: ${new Date(reservation.date).toLocaleDateString('en-IN')}
🕐 Time: ${reservation.time}
👥 Guests: ${reservation.guestCount}
${reservation.occasion ? `🎊 Occasion: ${reservation.occasion}` : ''}
📋 Reservation #${reservation.reservationNumber}

Please arrive 5 minutes early.
For changes, call: ${process.env.RESTAURANT_PHONE}

See you soon! 😊
  `.trim();

  try {
    await twClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formatPhone(reservation.customer.phone),
      body: message
    });
    return true;
  } catch (err) {
    console.error('WhatsApp reservation error:', err.message);
    return false;
  }
};

// ─── Send Delivery Update ──────────────────────────────────────────────────────
exports.sendDeliveryUpdate = async (order, message) => {
  const twClient = getClient();
  if (!twClient || !order.customer?.phone) return false;

  try {
    await twClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formatPhone(order.customer.phone),
      body: `🛵 *${process.env.RESTAURANT_NAME}*\n\n${message}\n\nOrder #${order.orderNumber}`
    });
    return true;
  } catch (err) {
    console.error('WhatsApp delivery update error:', err.message);
    return false;
  }
};

// ─── Custom Message ────────────────────────────────────────────────────────────
exports.sendCustomMessage = async (phone, message) => {
  const twClient = getClient();
  if (!twClient) return { success: false, message: 'WhatsApp not configured' };

  try {
    const result = await twClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formatPhone(phone),
      body: message
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

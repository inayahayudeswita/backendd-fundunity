require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

async function sendWebhook() {
  // Ganti sesuai orderId yang kamu dapat dari createTransaction
  const orderId = "order-1685000000000";

  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  const payload = {
    order_id: orderId,
    status_code: "200",
    gross_amount: "10000.00",
    transaction_status: "settlement",
    fraud_status: "accept",
    transaction_id: "1234567890",
    payment_type: "bank_transfer",
  };

  // Generate signature_key seperti Midtrans
  const signatureString = payload.order_id + payload.status_code + payload.gross_amount + serverKey;
  const signature_key = crypto.createHash("sha512").update(signatureString).digest("hex");

  payload.signature_key = signature_key;

  try {
    const webhookUrl = process.env.MIDTRANS_NOTIFICATION_URL;

    const res = await axios.post(webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("✅ Webhook berhasil dikirim. Response:", res.status, res.data);
  } catch (error) {
    console.error("❌ Gagal kirim webhook:", error.response?.data || error.message);
  }
}

sendWebhook();

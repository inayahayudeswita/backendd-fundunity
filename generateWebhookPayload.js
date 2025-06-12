const crypto = require("crypto");
const axios = require("axios");

// 🚨 Ganti dengan serverKey Midtrans kamu (gunakan dari env kalau bisa)
const serverKey = "SB-Mid-server-_UnhA5sDl77J0FYIgwKrmONQ";

// 🚨 Ganti ini dengan orderId yang sudah ada di database
const orderId = "order-1685000000000";

// Data simulasi dari Midtrans
const payload = {
  order_id: orderId,
  status_code: "200",
  gross_amount: "10000.00", // pastikan cocok dengan yg di DB
  transaction_status: "settlement", // bisa ganti ke: pending, capture, cancel, etc.
  fraud_status: "accept",           // cuma relevan kalau capture
  transaction_id: "1234567890",
  payment_type: "bank_transfer",
};

// 🔐 Generate signature_key seperti Midtrans lakukan
const signatureString = payload.order_id + payload.status_code + payload.gross_amount + serverKey;
const signature_key = crypto.createHash("sha512").update(signatureString).digest("hex");

// Tambahkan signature ke payload
payload.signature_key = signature_key;

// ✅ Tampilkan payload ke console
console.log("🚀 Payload siap dikirim:", payload);

// 🌐 Ganti URL ini dengan alamat ngrok aktif kamu
const webhookUrl = "https://1234-abcd.ngrok-free.app/v1/content/transaction/notification";

// Kirim request ke webhook endpoint (POST)
axios
  .post(webhookUrl, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  })
  .then((res) => {
    console.log("✅ Response dari server webhook:", res.status, res.data);
  })
  .catch((err) => {
    if (err.response) {
      console.error("❌ Gagal:", err.response.status, err.response.data);
    } else {
      console.error("❌ Error saat kirim webhook:", err.message);
    }
  });

require("dotenv").config();
const axios = require("axios");

async function createTransaction() {
  try {
    const res = await axios.post("http://localhost:3000/v1/content/transaction", {
      nama: "Budi",
      email: "budi@example.com",
      amount: 10000,
      notes: "Testing pembayaran Midtrans",
    });
    console.log("✅ Transaksi berhasil dibuat:");
    console.log(res.data);
    console.log("Gunakan redirectUrl untuk pembayaran:");
    console.log(res.data.redirectUrl);
  } catch (error) {
    console.error("❌ Gagal buat transaksi:", error.response?.data || error.message);
  }
}

createTransaction();

const midtransClient = require("midtrans-client");

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

const createTransaction = async (data) => {
  const parameter = {
    transaction_details: {
      order_id: `DONATE-${Date.now()}`,
      gross_amount: data.amount,
    },
    customer_details: {
      first_name: data.nama, // <- pakai "nama" sesuai field kamu
      email: data.email || "donor@example.com", // fallback kalau kosong
    },
  };

  return await snap.createTransaction(parameter);
};

module.exports = { createTransaction };

const crypto = require("crypto");
const midtransClient = require("midtrans-client");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Snap Client (Production/Sandbox sesuai setting)
const snap = new midtransClient.Snap({
  isProduction: true, // ubah ke false kalau masih Sandbox
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// ✅ 1. Create Transaction
exports.createTransaction = async (req, res) => {
  const { nama, email, amount, notes } = req.body;

  if (!nama || !email || !amount || !notes) {
    return res.status(400).json({
      error: "Missing required fields: nama, email, amount, notes",
    });
  }

  // 🔑 Order ID konsisten dengan DB & Midtrans
  const orderId = `fundunity-${Date.now()}`;

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      first_name: nama,
      email,
    },
    credit_card: { secure: true },
    item_details: [
      {
        id: "donasi",
        name: "Donasi",
        quantity: 1,
        price: amount,
      },
    ],
    notification_url:
      "https://backendd-fundunity.onrender.com/v1/content/transaction/notification",
    callbacks: {
      finish: "https://landing-page-fundunity.vercel.app/thankyou",
    },
  };

  try {
    const midtransRes = await snap.createTransaction(parameter);

    await prisma.transaction.create({
      data: {
        orderId,
        nama,
        email,
        amount,
        notes,
        status: "pending",
      },
    });

    res.status(201).json({
      snapToken: midtransRes.token,
      redirectUrl: midtransRes.redirect_url,
      message: "Transaction created successfully",
    });
  } catch (error) {
    console.error("❌ Midtrans error:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

// ✅ 2. Get All Transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(transactions);
  } catch (error) {
    console.error("❌ Failed to fetch transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// ✅ 3. Webhook Notification
export const handleNotification = async (req, res) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
    } = req.body;

    // 🔑 Ambil serverKey dari Midtrans Dashboard
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    // ✅ Signature string harus sesuai format Midtrans
    const signatureString = order_id + status_code + gross_amount + serverKey;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(signatureString)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.warn("⚠️ Invalid signature Midtrans untuk:", order_id);
      console.warn("Expected:", expectedSignature);
      console.warn("Got:", signature_key);
      return res.status(400).json({ message: "Invalid signature" });
    }

    console.log("📩 Webhook valid diterima untuk:", order_id);

    // ✅ Update status transaksi ke database
    let newStatus = "pending";
    if (transaction_status === "settlement") {
      newStatus = "berhasil";
    } else if (transaction_status === "expire" || transaction_status === "cancel") {
      newStatus = "gagal";
    } else if (transaction_status === "deny") {
      newStatus = "gagal";
    }

    await prisma.transaction.update({
      where: { orderId: order_id },
      data: { status: newStatus },
    });

    console.log(`✅ Updated transaction ${order_id} ➔ ${newStatus}`);
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error("❌ Error handleNotification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ 4. Manual check (opsional, pakai cron polling)
const { checkTransactions } = require("../../midtransPolling");
exports.checkStatus = async (req, res) => {
  try {
    await checkTransactions();
    res.status(200).send("✅ Transaction status checked & updated");
  } catch (error) {
    console.error("❌ Failed to check status:", error);
    res.status(500).send("Internal Server Error");
  }
};

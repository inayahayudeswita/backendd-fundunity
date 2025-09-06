const crypto = require("crypto");
const midtransClient = require("midtrans-client");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Snap (buat transaksi donasi)
const snap = new midtransClient.Snap({
  isProduction: true, // ⚠️ ganti false kalau sandbox
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// ✅ CoreApi (buat validasi notifikasi)
const core = new midtransClient.CoreApi({
  isProduction: true,
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

  const orderId = `order-${Date.now()}`;

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
    // ✅ Midtrans akan call URL ini
    notification_url:
      "https://backendd-fundunity.onrender.com/api/midtrans/notification",
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

// ✅ 3. Midtrans Notification Handler
exports.handleNotification = async (req, res) => {
  try {
    console.log("📩 Webhook masuk:", req.originalUrl);
    console.log("📦 Body:", JSON.stringify(req.body, null, 2));

    // ✅ balas dulu biar Midtrans tidak retry
    res.status(200).json({ received: true });

    const statusResponse = await core.transaction.notification(req.body);

    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_time,
      va_numbers,
      bill_key,
    } = statusResponse;

    // 🔎 Cari transaksi di DB
    const existing = await prisma.transaction.findFirst({
      where: { orderId: order_id },
    });

    if (!existing) {
      console.warn("⚠️ Transaction not found in DB:", order_id);
      return;
    }

    // 🎯 Tentukan status baru
    let newStatus = "pending";
    switch (transaction_status) {
      case "capture":
        newStatus = fraud_status === "challenge" ? "gagal" : "berhasil";
        break;
      case "settlement":
        newStatus = "berhasil";
        break;
      case "cancel":
      case "deny":
      case "expire":
        newStatus = "gagal";
        break;
    }

    // 📝 Update transaksi
    await prisma.transaction.update({
      where: { orderId: order_id },
      data: {
        status: newStatus,
        paymentType: payment_type || null,
        transactionTime: transaction_time ? new Date(transaction_time) : null,
        fraudStatus: fraud_status || null,
        vaNumber:
          payment_type === "bank_transfer"
            ? va_numbers?.[0]?.va_number || null
            : bill_key || null,
        bank:
          payment_type === "bank_transfer"
            ? va_numbers?.[0]?.bank || null
            : payment_type === "echannel"
            ? "mandiri"
            : payment_type,
      },
    });

    console.log(`✅ Transaction ${order_id} updated ➔ ${newStatus}`);
  } catch (err) {
    console.error("❌ Webhook error:", err);
  }
};

// ✅ 4. Manual check (polling opsional)
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

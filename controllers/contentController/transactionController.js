const crypto = require("crypto");
const midtransClient = require("midtrans-client");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Snap Client (Production)
const snap = new midtransClient.Snap({
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

  // 🔑 Order ID konsisten dengan DB dan Midtrans
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
      "https://backendd-fundunity.onrender.com/api/v1/content/transaction/notification",
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
exports.handleNotification = async (req, res) => {
  try {
    console.log("📩 Webhook diterima di:", req.originalUrl);
    console.log("📦 Body:", JSON.stringify(req.body, null, 2));

    // ✅ Balas lebih dulu biar Midtrans tidak retry
    res.status(200).json({ received: true });

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_time,
      va_numbers,
      bill_key,
    } = req.body;

    // 🔑 Validasi signature Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.warn("⚠️ Invalid signature Midtrans untuk:", order_id);
      return;
    }

    // 🔎 Cari transaksi di DB
    let trx = await prisma.transaction.findUnique({
      where: { orderId: order_id },
    });

    // ⚡ Kalau transaksi gak ketemu (misalnya test notif), buat baru
    if (!trx) {
      console.warn("⚠️ Transaction not found, creating new:", order_id);
      trx = await prisma.transaction.create({
        data: {
          orderId: order_id,
          nama: "Webhook User",
          email: "webhook@test.com",
          amount: parseInt(gross_amount),
          notes: "Created from webhook",
          status: transaction_status === "settlement" ? "berhasil" : "pending",
          paymentType: payment_type,
          fraudStatus: fraud_status,
          transactionTime: transaction_time ? new Date(transaction_time) : null,
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
      console.log(`✅ Transaction ${order_id} created from webhook`);
      return;
    }

    // 🎯 Update status kalau transaksi sudah ada
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

// ✅ 4. Manual check (opsional)
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

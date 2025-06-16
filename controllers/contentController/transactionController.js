const crypto = require("crypto");
const midtransClient = require("midtrans-client");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const snap = new midtransClient.Snap({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// ✅ 1. Create Transaction (Snap)
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
    notification_url: process.env.MIDTRANS_NOTIFICATION_URL,
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

// ✅ 3. Handle Midtrans Webhook Notification
exports.handleNotification = async (req, res) => {
  try {
    const rawBody = req.body.toString("utf8");
    console.log("📩 Notification received:", rawBody);

    const data = JSON.parse(rawBody);
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
    } = data;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    const expectedSignature = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.warn("⚠️ Invalid signature");
      return res.status(403).send("Invalid signature");
    }

    const existing = await prisma.transaction.findUnique({
      where: { orderId: order_id },
    });

    if (!existing) {
      console.warn("⚠️ Transaction not found in DB:", order_id);
      return res.status(404).send("Transaction not found");
    }

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
      case "pending":
      default:
        newStatus = "pending";
    }

    // VA number handling for bank_transfer or echannel
    let vaNumber = null;
    let bank = null;

    if (payment_type === "bank_transfer") {
      vaNumber = va_numbers?.[0]?.va_number || null;
      bank = va_numbers?.[0]?.bank || null;
    } else if (payment_type === "echannel") {
      vaNumber = bill_key || null;
      bank = "mandiri";
    } else if (["gopay", "qris"].includes(payment_type)) {
      bank = payment_type;
    }

    await prisma.transaction.update({
      where: { orderId: order_id },
      data: {
        status: newStatus,
        paymentType: payment_type || null,
        transactionTime: transaction_time ? new Date(transaction_time) : null,
        fraudStatus: fraud_status || null,
        vaNumber,
        bank,
      },
    });

    console.log(`✅ Updated transaction ${order_id} to status: ${newStatus}`);
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    res.status(500).send("Internal Server Error");
  }
};

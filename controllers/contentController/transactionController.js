const crypto = require("crypto");
const midtransClient = require("midtrans-client");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Create Transaction
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
    credit_card: {
      secure: true,
    },
    notification_url: process.env.MIDTRANS_NOTIFICATION_URL,
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

// Get All Transactions
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

// Handle Midtrans Webhook Notification (optional, jika webhook dipakai)
exports.handleNotification = async (req, res) => {
  try {
    const rawBody = req.body.toString();
    const data = JSON.parse(rawBody);

    const { order_id, status_code, gross_amount, signature_key } = data;
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

    if (data.transaction_status === "capture") {
      newStatus = data.fraud_status === "challenge" ? "gagal" : "berhasil";
    } else if (data.transaction_status === "settlement") {
      newStatus = "berhasil";
    } else if (["cancel", "deny", "expire"].includes(data.transaction_status)) {
      newStatus = "gagal";
    }

    await prisma.transaction.update({
      where: { orderId: order_id },
      data: { status: newStatus },
    });

    console.log(`✅ Transaction ${order_id} updated to ${newStatus}`);
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    res.status(500).send("Internal Server Error");
  }
};

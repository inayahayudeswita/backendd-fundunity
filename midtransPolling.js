const cron = require("node-cron");
const midtransClient = require("midtrans-client");
const { prisma } = require("./config/db");

const snap = new midtransClient.Snap({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkTransactions = async () => {
  console.log("⏰ Mulai cek status transaksi pending...");

  try {
    const pendingTransactions = await prisma.transaction.findMany({
      where: { status: "pending" },
    });

    if (!pendingTransactions.length) {
      console.log("✅ Tidak ada transaksi pending");
      return;
    }

    for (const trx of pendingTransactions) {
      try {
        const response = await snap.transaction.status(trx.orderId);

        let newStatus = "pending";
        if (response.transaction_status === "capture") {
          newStatus = response.fraud_status === "challenge" ? "gagal" : "berhasil";
        } else if (response.transaction_status === "settlement") {
          newStatus = "berhasil";
        } else if (["cancel", "deny", "expire"].includes(response.transaction_status)) {
          newStatus = "gagal";
        }

        let vaNumber = null;
        let bank = null;

        if (response.payment_type === "bank_transfer") {
          vaNumber = response.va_numbers?.[0]?.va_number || null;
          bank = response.va_numbers?.[0]?.bank || null;
        } else if (response.payment_type === "echannel") {
          vaNumber = response.bill_key || null;
          bank = "mandiri";
        } else if (["gopay", "qris"].includes(response.payment_type)) {
          bank = response.payment_type;
        }

        const updatedData = {
          status: newStatus,
          paymentType: response.payment_type || null,
          transactionTime: response.transaction_time
            ? new Date(response.transaction_time)
            : null,
          fraudStatus: response.fraud_status || null,
          vaNumber,
          bank,
        };

        const isStatusChanged = newStatus !== trx.status;
        const hasMissingInfo =
          !trx.paymentType || !trx.transactionTime || !trx.vaNumber || !trx.bank;

        if (isStatusChanged || hasMissingInfo) {
          await prisma.transaction.update({
            where: { orderId: trx.orderId },
            data: updatedData,
          });
          console.log(`✅ Updated transaction ${trx.orderId} to ${newStatus}`);
        } else {
          console.log(`ℹ️ No update needed for ${trx.orderId}`);
        }

        await delay(500);
      } catch (err) {
        console.error(`❌ Error checking ${trx.orderId}:`, err.message);
      }
    }
  } catch (error) {
    console.error("❌ Error saat fetch transaksi pending:", error.message);
    throw error; // lempar ke caller (biar bisa di-handle kalau dipanggil dari route)
  }
};

function start() {
  console.log("🟢 Midtrans polling dimulai setiap 1 menit...");
  cron.schedule("* * * * *", async () => {
    try {
      await checkTransactions();
    } catch (err) {
      console.error("❌ Error in scheduled checkTransactions:", err.message);
    }
  });
}

module.exports = { start, checkTransactions };

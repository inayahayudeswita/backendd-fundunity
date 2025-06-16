const cron = require("node-cron");
const midtransClient = require("midtrans-client");
const { prisma } = require("./config/db");

const snap = new midtransClient.Snap({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const checkTransactions = async () => {
  console.log("⏰ Cek status transaksi (cron jalan)");

  try {
    const pendingTransactions = await prisma.transaction.findMany({
      where: { status: "pending" },
    });

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

        const vaNumber = response.va_numbers?.[0]?.va_number || null;
        const bank = response.va_numbers?.[0]?.bank || null;

        const updatedData = {
          status: newStatus,
          paymentType: response.payment_type || null,
          transactionTime: response.transaction_time ? new Date(response.transaction_time) : null,
          fraudStatus: response.fraud_status || null,
          vaNumber,
          bank,
        };

        // Update hanya jika status-nya beda atau field lainnya belum terisi
        const isStatusChanged = newStatus !== trx.status;
        const hasMissingInfo =
          !trx.paymentType || !trx.transactionTime || !trx.vaNumber || !trx.bank;

        if (isStatusChanged || hasMissingInfo) {
          await prisma.transaction.update({
            where: { orderId: trx.orderId },
            data: updatedData,
          });
          console.log(`✅ Updated transaction ${trx.orderId} to ${newStatus}`);
        }

        await delay(500); // prevent API rate limit
      } catch (err) {
        console.error(`❌ Gagal update transaksi ${trx.orderId}:`, err.message);
      }
    }
  } catch (error) {
    console.error("❌ Error saat fetch transaksi pending:", error.message);
  }
};

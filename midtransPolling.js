const cron = require("node-cron");
const midtransClient = require("midtrans-client");
const { prisma } = require("./config/db");

const snap = new midtransClient.Snap({
  isProduction: false,
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

        if (newStatus !== trx.status) {
          await prisma.transaction.update({
            where: { orderId: trx.orderId },
            data: { status: newStatus },
          });
          console.log(`✅ Updated transaction ${trx.orderId} to ${newStatus}`);
        }
        await delay(500); // Delay supaya gak ngebomb API dan DB
      } catch (err) {
        console.error(`❌ Gagal update transaksi ${trx.orderId}:`, err);
      }
    }
  } catch (error) {
    console.error("❌ Error saat fetch transaksi pending:", error);
  }
};

const start = () => {
  cron.schedule("* * * * *", checkTransactions); // tiap menit jalan
};

module.exports = { start };

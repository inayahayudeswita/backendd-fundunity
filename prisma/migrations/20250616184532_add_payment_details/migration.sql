-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "bank" TEXT,
ADD COLUMN     "fraudStatus" TEXT,
ADD COLUMN     "paymentType" TEXT,
ADD COLUMN     "transactionTime" TIMESTAMP(3),
ADD COLUMN     "vaNumber" TEXT;

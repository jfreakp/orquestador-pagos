-- DropForeignKey
ALTER TABLE "transaction_errors" DROP CONSTRAINT "transaction_errors_transaction_id_fkey";

-- AlterTable
ALTER TABLE "transaction_errors" ALTER COLUMN "transaction_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transaction_errors" ADD CONSTRAINT "transaction_errors_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

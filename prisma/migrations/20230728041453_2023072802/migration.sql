-- DropForeignKey
ALTER TABLE "IncomeRecord" DROP CONSTRAINT "IncomeRecord_payoutRecordId_fkey";

-- AddForeignKey
ALTER TABLE "IncomeRecord" ADD CONSTRAINT "IncomeRecord_payoutRecordId_fkey" FOREIGN KEY ("payoutRecordId") REFERENCES "PayoutRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

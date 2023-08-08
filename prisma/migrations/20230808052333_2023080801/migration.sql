/*
  Warnings:

  - You are about to drop the column `memo` on the `PayoutRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PayoutRecord" DROP COLUMN "memo",
ADD COLUMN     "paymentMemo" TEXT;

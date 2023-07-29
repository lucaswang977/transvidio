/*
  Warnings:

  - You are about to drop the column `target` on the `PayoutRecord` table. All the data in the column will be lost.
  - Added the required column `paymentTarget` to the `PayoutRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PayoutRecord" DROP COLUMN "target",
ADD COLUMN     "paymentTarget" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paymentCurrency" "Currency";

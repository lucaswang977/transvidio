/*
  Warnings:

  - You are about to drop the column `currency` on the `PayoutRecord` table. All the data in the column will be lost.
  - You are about to drop the column `rate` on the `PayoutRecord` table. All the data in the column will be lost.
  - Added the required column `exchangeRate` to the `PayoutRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentCurrency` to the `PayoutRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PayoutRecord" DROP COLUMN "currency",
DROP COLUMN "rate",
ADD COLUMN     "exchangeRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "paymentCurrency" "Currency" NOT NULL,
ALTER COLUMN "memo" DROP NOT NULL;

/*
  Warnings:

  - Added the required column `projectId` to the `PayoutRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PayoutRecord" ADD COLUMN     "projectId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PayoutRecord" ADD CONSTRAINT "PayoutRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

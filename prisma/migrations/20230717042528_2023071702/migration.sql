/*
  Warnings:

  - The primary key for the `AppConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `AppConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppConfig" DROP CONSTRAINT "AppConfig_pkey",
DROP COLUMN "id";

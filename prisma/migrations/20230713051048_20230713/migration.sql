/*
  Warnings:

  - You are about to drop the column `text` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the `Announcement` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `action` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `memo` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityTarget" AS ENUM ('USER', 'PROJECT', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ActivityActionType" AS ENUM ('UserRegister', 'UserProfileModify', 'ProjectCreate', 'ProjectAssign', 'ProjectUnassign', 'DocumentClaim', 'DocumentReset', 'DocumentSubmit', 'DocumentClose');

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "text",
DROP COLUMN "type",
ADD COLUMN     "action" "ActivityActionType" NOT NULL,
ADD COLUMN     "memo" TEXT NOT NULL,
ADD COLUMN     "target" "ActivityTarget" NOT NULL;

-- DropTable
DROP TABLE "Announcement";

-- DropEnum
DROP TYPE "ActivityType";

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

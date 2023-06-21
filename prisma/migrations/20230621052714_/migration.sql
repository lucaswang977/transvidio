-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('USER', 'PROJECT', 'DOCUMENT');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seq" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "documentId" TEXT,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

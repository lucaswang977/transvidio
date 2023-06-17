/*
  Warnings:

  - The values [DOC] on the enum `DocumentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentType_new" AS ENUM ('INTRODUCTION', 'CURRICULUM', 'SUBTITLE', 'ARTICLE', 'QUIZ', 'ATTACHMENT');
ALTER TABLE "Document" ALTER COLUMN "type" TYPE "DocumentType_new" USING ("type"::text::"DocumentType_new");
ALTER TYPE "DocumentType" RENAME TO "DocumentType_old";
ALTER TYPE "DocumentType_new" RENAME TO "DocumentType";
DROP TYPE "DocumentType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ProjectsOfUsers" DROP CONSTRAINT "ProjectsOfUsers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectsOfUsers" DROP CONSTRAINT "ProjectsOfUsers_userId_fkey";

-- AddForeignKey
ALTER TABLE "ProjectsOfUsers" ADD CONSTRAINT "ProjectsOfUsers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectsOfUsers" ADD CONSTRAINT "ProjectsOfUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

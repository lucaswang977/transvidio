/*
  Warnings:

  - The values [COMPLETE] on the enum `DocumentState` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentState_new" AS ENUM ('OPEN', 'WORKING', 'REVIEW', 'CLOSED');
ALTER TABLE "Document" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "Document" ALTER COLUMN "state" TYPE "DocumentState_new" USING ("state"::text::"DocumentState_new");
ALTER TYPE "DocumentState" RENAME TO "DocumentState_old";
ALTER TYPE "DocumentState_new" RENAME TO "DocumentState";
DROP TYPE "DocumentState_old";
ALTER TABLE "Document" ALTER COLUMN "state" SET DEFAULT 'OPEN';
COMMIT;

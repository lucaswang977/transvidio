/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `AppConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_key_key" ON "AppConfig"("key");

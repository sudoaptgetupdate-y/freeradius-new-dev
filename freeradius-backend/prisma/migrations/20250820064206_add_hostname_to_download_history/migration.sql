/*
  Warnings:

  - Added the required column `hostname` to the `LogDownloadHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `LogDownloadHistory` ADD COLUMN `hostname` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE INDEX `LogDownloadHistory_hostname_idx` ON `LogDownloadHistory`(`hostname`);

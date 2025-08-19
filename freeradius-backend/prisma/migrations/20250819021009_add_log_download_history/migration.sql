-- CreateTable
CREATE TABLE `LogDownloadHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(255) NOT NULL,
    `ipAddress` VARCHAR(45) NOT NULL,
    `adminId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LogDownloadHistory_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LogDownloadHistory` ADD CONSTRAINT `LogDownloadHistory_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Administrator`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

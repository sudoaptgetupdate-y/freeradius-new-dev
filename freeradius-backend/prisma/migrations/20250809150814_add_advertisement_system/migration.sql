-- AlterTable
ALTER TABLE `Organization` ADD COLUMN `advertisementId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Advertisement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `videoUrl` VARCHAR(191) NULL,
    `headerText` VARCHAR(191) NULL,
    `bodyText` TEXT NULL,
    `buttonText` VARCHAR(191) NOT NULL DEFAULT 'Continue to Internet',
    `buttonUrl` VARCHAR(191) NOT NULL DEFAULT 'https://www.ntplc.co.th',
    `countdown` INTEGER NULL DEFAULT 5,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Advertisement_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_advertisementId_fkey` FOREIGN KEY (`advertisementId`) REFERENCES `Advertisement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

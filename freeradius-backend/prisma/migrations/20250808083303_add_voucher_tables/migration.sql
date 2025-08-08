-- CreateTable
CREATE TABLE `VoucherPackage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `durationDays` INTEGER NOT NULL,
    `price` DOUBLE NULL,
    `radiusProfileId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VoucherPackage_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VoucherBatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchIdentifier` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `quantity` INTEGER NOT NULL,
    `packageName` VARCHAR(191) NOT NULL,
    `usernamePrefix` VARCHAR(191) NOT NULL,
    `passwordType` VARCHAR(191) NOT NULL,
    `usersJson` TEXT NOT NULL,
    `createdById` INTEGER NOT NULL,

    UNIQUE INDEX `VoucherBatch_batchIdentifier_key`(`batchIdentifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VoucherPackage` ADD CONSTRAINT `VoucherPackage_radiusProfileId_fkey` FOREIGN KEY (`radiusProfileId`) REFERENCES `RadiusProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoucherBatch` ADD CONSTRAINT `VoucherBatch_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Administrator`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

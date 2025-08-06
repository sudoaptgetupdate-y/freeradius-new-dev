-- CreateTable
CREATE TABLE `nas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nasname` VARCHAR(128) NOT NULL,
    `shortname` VARCHAR(32) NULL,
    `type` VARCHAR(30) NULL DEFAULT 'other',
    `ports` INTEGER NULL,
    `secret` VARCHAR(60) NOT NULL DEFAULT 'secret',
    `server` VARCHAR(64) NULL,
    `community` VARCHAR(50) NULL,
    `description` VARCHAR(200) NULL DEFAULT 'RADIUS Client',

    INDEX `nasname`(`nasname`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nasreload` (
    `nasipaddress` VARCHAR(15) NOT NULL,
    `reloadtime` DATETIME(0) NOT NULL,

    PRIMARY KEY (`nasipaddress`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radacct` (
    `radacctid` BIGINT NOT NULL AUTO_INCREMENT,
    `acctsessionid` VARCHAR(64) NOT NULL DEFAULT '',
    `acctuniqueid` VARCHAR(32) NOT NULL DEFAULT '',
    `username` VARCHAR(64) NOT NULL DEFAULT '',
    `realm` VARCHAR(64) NULL DEFAULT '',
    `nasipaddress` VARCHAR(15) NOT NULL DEFAULT '',
    `nasportid` VARCHAR(32) NULL,
    `nasporttype` VARCHAR(32) NULL,
    `acctstarttime` DATETIME(0) NULL,
    `acctupdatetime` DATETIME(0) NULL,
    `acctstoptime` DATETIME(0) NULL,
    `acctinterval` INTEGER NULL,
    `acctsessiontime` INTEGER UNSIGNED NULL,
    `acctauthentic` VARCHAR(32) NULL,
    `connectinfo_start` VARCHAR(128) NULL,
    `connectinfo_stop` VARCHAR(128) NULL,
    `acctinputoctets` BIGINT NULL,
    `acctoutputoctets` BIGINT NULL,
    `calledstationid` VARCHAR(50) NOT NULL DEFAULT '',
    `callingstationid` VARCHAR(50) NOT NULL DEFAULT '',
    `acctterminatecause` VARCHAR(32) NOT NULL DEFAULT '',
    `servicetype` VARCHAR(32) NULL,
    `framedprotocol` VARCHAR(32) NULL,
    `framedipaddress` VARCHAR(15) NOT NULL DEFAULT '',
    `framedipv6address` VARCHAR(45) NOT NULL DEFAULT '',
    `framedipv6prefix` VARCHAR(45) NOT NULL DEFAULT '',
    `framedinterfaceid` VARCHAR(44) NOT NULL DEFAULT '',
    `delegatedipv6prefix` VARCHAR(45) NOT NULL DEFAULT '',
    `class` VARCHAR(64) NULL,

    UNIQUE INDEX `acctuniqueid`(`acctuniqueid`),
    INDEX `acctinterval`(`acctinterval`),
    INDEX `acctsessionid`(`acctsessionid`),
    INDEX `acctsessiontime`(`acctsessiontime`),
    INDEX `acctstarttime`(`acctstarttime`),
    INDEX `acctstoptime`(`acctstoptime`),
    INDEX `class`(`class`),
    INDEX `delegatedipv6prefix`(`delegatedipv6prefix`),
    INDEX `framedinterfaceid`(`framedinterfaceid`),
    INDEX `framedipaddress`(`framedipaddress`),
    INDEX `framedipv6address`(`framedipv6address`),
    INDEX `framedipv6prefix`(`framedipv6prefix`),
    INDEX `nasipaddress`(`nasipaddress`),
    INDEX `username`(`username`),
    PRIMARY KEY (`radacctid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radcheck` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL DEFAULT '',
    `attribute` VARCHAR(64) NOT NULL DEFAULT '',
    `op` CHAR(2) NOT NULL DEFAULT '==',
    `value` VARCHAR(253) NOT NULL DEFAULT '',

    INDEX `username`(`username`(32)),
    UNIQUE INDEX `radcheck_username_attribute_key`(`username`, `attribute`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radgroupcheck` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `groupname` VARCHAR(64) NOT NULL DEFAULT '',
    `attribute` VARCHAR(64) NOT NULL DEFAULT '',
    `op` CHAR(2) NOT NULL DEFAULT '==',
    `value` VARCHAR(253) NOT NULL DEFAULT '',

    INDEX `groupname`(`groupname`(32)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radgroupreply` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `groupname` VARCHAR(64) NOT NULL DEFAULT '',
    `attribute` VARCHAR(64) NOT NULL DEFAULT '',
    `op` CHAR(2) NOT NULL DEFAULT '=',
    `value` VARCHAR(253) NOT NULL DEFAULT '',

    INDEX `groupname`(`groupname`(32)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radpostauth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL DEFAULT '',
    `pass` VARCHAR(64) NOT NULL DEFAULT '',
    `reply` VARCHAR(32) NOT NULL DEFAULT '',
    `authdate` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `class` VARCHAR(64) NULL,

    INDEX `class`(`class`),
    INDEX `username`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radreply` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL DEFAULT '',
    `attribute` VARCHAR(64) NOT NULL DEFAULT '',
    `op` CHAR(2) NOT NULL DEFAULT '=',
    `value` VARCHAR(253) NOT NULL DEFAULT '',

    INDEX `username`(`username`(32)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radusergroup` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL DEFAULT '',
    `groupname` VARCHAR(64) NOT NULL DEFAULT '',
    `priority` INTEGER NOT NULL DEFAULT 1,

    INDEX `username`(`username`(32)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Administrator` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `fullName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Administrator_username_key`(`username`),
    UNIQUE INDEX `Administrator_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RadiusProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RadiusProfile_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `login_identifier_type` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `radiusProfileId` INTEGER NOT NULL,

    UNIQUE INDEX `Organization_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizationId` INTEGER NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `national_id` VARCHAR(191) NULL,
    `employee_id` VARCHAR(191) NULL,
    `student_id` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` INTEGER NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_national_id_key`(`national_id`),
    UNIQUE INDEX `User_employee_id_key`(`employee_id`),
    UNIQUE INDEX `User_student_id_key`(`student_id`),
    INDEX `User_organizationId_fkey`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `radgroupcheck` ADD CONSTRAINT `radgroupcheck_groupname_fkey` FOREIGN KEY (`groupname`) REFERENCES `RadiusProfile`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `radgroupreply` ADD CONSTRAINT `radgroupreply_groupname_fkey` FOREIGN KEY (`groupname`) REFERENCES `RadiusProfile`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_radiusProfileId_fkey` FOREIGN KEY (`radiusProfileId`) REFERENCES `RadiusProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Administrator`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

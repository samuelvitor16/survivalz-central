-- AlterTable
ALTER TABLE `users` ADD COLUMN `reputation` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `signatureImageUrl` VARCHAR(191) NULL,
    ADD COLUMN `signatureText` TEXT NULL;

-- CreateTable
CREATE TABLE `medals` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `rarity` ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'SPECIAL') NOT NULL DEFAULT 'COMMON',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `medals_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_medals` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `medalId` VARCHAR(191) NOT NULL,
    `awardedById` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_medals_userId_medalId_key`(`userId`, `medalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_medals` ADD CONSTRAINT `user_medals_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_medals` ADD CONSTRAINT `user_medals_medalId_fkey` FOREIGN KEY (`medalId`) REFERENCES `medals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_medals` ADD CONSTRAINT `user_medals_awardedById_fkey` FOREIGN KEY (`awardedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

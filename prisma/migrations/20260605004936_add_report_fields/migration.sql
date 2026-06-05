-- AlterTable
ALTER TABLE `forum_topics` ADD COLUMN `reportAccusedNick` VARCHAR(191) NULL,
    ADD COLUMN `reportEvidence` TEXT NULL,
    ADD COLUMN `reportReason` VARCHAR(191) NULL;

CREATE TABLE `BlastCampaign` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `deviceId` INTEGER NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'RUNNING',
  `speed` VARCHAR(191) NULL,
  `totalTargets` INTEGER NOT NULL DEFAULT 0,
  `processedTargets` INTEGER NOT NULL DEFAULT 0,
  `successTargets` INTEGER NOT NULL DEFAULT 0,
  `failedTargets` INTEGER NOT NULL DEFAULT 0,
  `skippedTargets` INTEGER NOT NULL DEFAULT 0,
  `currentIndex` INTEGER NOT NULL DEFAULT 0,
  `currentTarget` VARCHAR(191) NULL,
  `error` TEXT NULL,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `finishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `BlastCampaign_deviceId_createdAt_idx`(`deviceId`, `createdAt`),
  INDEX `BlastCampaign_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `BlastCampaign_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BlastCampaign`
  ADD CONSTRAINT `BlastCampaign_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `BlastCampaign`
  ADD CONSTRAINT `BlastCampaign_deviceId_fkey`
  FOREIGN KEY (`deviceId`) REFERENCES `WhatsAppDevice`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

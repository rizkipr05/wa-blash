DELETE bl1
FROM `BlastLog` bl1
INNER JOIN `BlastLog` bl2
  ON bl1.`userId` = bl2.`userId`
  AND bl1.`target` = bl2.`target`
  AND bl1.`id` > bl2.`id`;

ALTER TABLE `BlastLog`
  MODIFY `status` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `BlastLog_userId_target_key` ON `BlastLog`(`userId`, `target`);

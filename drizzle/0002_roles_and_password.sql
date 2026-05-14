-- Migration: Add tutor/estagiario roles and passwordHash field
-- Run this after the existing migrations

-- Add passwordHash column
ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255);

-- Modify role enum to include tutor and estagiario
-- NOTE: In MySQL you need to drop and recreate the enum column
-- First rename old column
ALTER TABLE `users` ADD COLUMN `role_new` ENUM('estagiario','tutor','admin') NOT NULL DEFAULT 'estagiario';

-- Migrate existing data: 'user' -> 'estagiario', 'admin' -> 'admin'
UPDATE `users` SET `role_new` = 'estagiario' WHERE `role` = 'user';
UPDATE `users` SET `role_new` = 'admin' WHERE `role` = 'admin';

-- Drop old column and rename
ALTER TABLE `users` DROP COLUMN `role`;
ALTER TABLE `users` RENAME COLUMN `role_new` TO `role`;

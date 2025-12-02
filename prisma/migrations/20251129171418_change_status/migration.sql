/*
  Warnings:

  - You are about to alter the column `status` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.

*/
-- DropIndex
DROP INDEX "users_created_at_idx";

-- DropIndex
DROP INDEX "users_status_idx";

-- DropIndex
DROP INDEX "users_tag_idx";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "status" SET DATA TYPE VARCHAR(10);

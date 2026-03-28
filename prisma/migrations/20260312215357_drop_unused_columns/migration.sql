/*
  Warnings:

  - You are about to drop the column `sub_last_opened_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `sub_last_user_agent` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "sub_last_opened_at",
DROP COLUMN "sub_last_user_agent";

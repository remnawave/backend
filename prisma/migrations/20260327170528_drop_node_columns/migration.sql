/*
  Warnings:

  - You are about to drop the column `node_version` on the `nodes` table. All the data in the column will be lost.
  - You are about to drop the column `users_online` on the `nodes` table. All the data in the column will be lost.
  - You are about to drop the column `xray_uptime` on the `nodes` table. All the data in the column will be lost.
  - You are about to drop the column `xray_version` on the `nodes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "nodes" DROP COLUMN "node_version",
DROP COLUMN "users_online",
DROP COLUMN "xray_uptime",
DROP COLUMN "xray_version";
/*
  Warnings:

  - You are about to drop the column `cpu_count` on the `nodes` table. All the data in the column will be lost.
  - You are about to drop the column `cpu_model` on the `nodes` table. All the data in the column will be lost.
  - You are about to drop the column `total_ram` on the `nodes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "nodes" DROP COLUMN "cpu_count",
DROP COLUMN "cpu_model",
DROP COLUMN "total_ram";
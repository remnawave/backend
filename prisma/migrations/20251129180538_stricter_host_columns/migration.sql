/*
  Warnings:

  - You are about to alter the column `remark` on the `hosts` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `server_description` on the `hosts` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.

*/
-- AlterTable
ALTER TABLE "hosts" 
    ALTER COLUMN "remark" SET DATA TYPE VARCHAR(50) USING LEFT("remark", 50),
    ALTER COLUMN "server_description" SET DATA TYPE VARCHAR(30) USING LEFT("server_description", 30);

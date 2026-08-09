-- DropIndex
DROP INDEX "acme_certificates_is_enabled_expires_at_idx";

-- AlterTable
ALTER TABLE "acme_certificates" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'ACME',
ALTER COLUMN "directory_url" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "acme_certificates_is_enabled_source_expires_at_idx" ON "acme_certificates"("is_enabled", "source", "expires_at");

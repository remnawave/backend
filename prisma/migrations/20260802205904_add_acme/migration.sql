-- CreateTable
CREATE TABLE "acme_credentials" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "payload_encrypted" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acme_credentials_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "acme_accounts" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "directory_url" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "account_url" TEXT,
    "account_key_encrypted" TEXT NOT NULL,
    "eab_kid" TEXT,
    "eab_hmac_encrypted" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acme_accounts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "acme_certificates" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "domains" TEXT[],
    "challenge_type" TEXT NOT NULL DEFAULT 'DNS_01',
    "key_type" TEXT NOT NULL DEFAULT 'ECDSA_P256',
    "renew_before_days" INTEGER NOT NULL DEFAULT 30,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "directory_url" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "eab_kid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "last_error" TEXT,
    "issued_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "fingerprint" TEXT,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "fullchain_pem" TEXT,
    "key_encrypted" TEXT,
    "credential_uuid" UUID,
    "account_uuid" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acme_certificates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "acme_certificate_nodes" (
    "certificate_uuid" UUID NOT NULL,
    "node_uuid" UUID NOT NULL,
    "inbound_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "acme_certificate_nodes_pkey" PRIMARY KEY ("certificate_uuid","node_uuid")
);

-- CreateTable
CREATE TABLE "acme_events" (
    "id" BIGSERIAL NOT NULL,
    "certificate_uuid" UUID,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acme_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "acme_credentials_name_key" ON "acme_credentials"("name");

-- CreateIndex
CREATE UNIQUE INDEX "acme_accounts_directory_url_email_key" ON "acme_accounts"("directory_url", "email");

-- CreateIndex
CREATE UNIQUE INDEX "acme_certificates_name_key" ON "acme_certificates"("name");

-- CreateIndex
CREATE INDEX "acme_certificates_is_enabled_expires_at_idx" ON "acme_certificates"("is_enabled", "expires_at");

-- CreateIndex
CREATE INDEX "acme_certificate_nodes_node_uuid_idx" ON "acme_certificate_nodes"("node_uuid");

-- CreateIndex
CREATE INDEX "acme_events_certificate_uuid_created_at_idx" ON "acme_events"("certificate_uuid", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "acme_certificates" ADD CONSTRAINT "acme_certificates_credential_uuid_fkey" FOREIGN KEY ("credential_uuid") REFERENCES "acme_credentials"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acme_certificates" ADD CONSTRAINT "acme_certificates_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "acme_accounts"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acme_certificate_nodes" ADD CONSTRAINT "acme_certificate_nodes_certificate_uuid_fkey" FOREIGN KEY ("certificate_uuid") REFERENCES "acme_certificates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acme_certificate_nodes" ADD CONSTRAINT "acme_certificate_nodes_node_uuid_fkey" FOREIGN KEY ("node_uuid") REFERENCES "nodes"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acme_events" ADD CONSTRAINT "acme_events_certificate_uuid_fkey" FOREIGN KEY ("certificate_uuid") REFERENCES "acme_certificates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

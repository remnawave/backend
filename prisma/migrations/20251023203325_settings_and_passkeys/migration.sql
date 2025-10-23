-- CreateTable
CREATE TABLE "public"."remnawave_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "passkey_settings" JSONB,
    "oauth2_settings" JSONB,
    "tg_auth_settings" JSONB,
    "password_settings" JSONB,
    "branding_settings" JSONB,

    CONSTRAINT "remnawave_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."passkeys" (
    "id" TEXT NOT NULL,
    "admin_uuid" UUID NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL,
    "device_type" TEXT NOT NULL,
    "backed_up" BOOLEAN NOT NULL,
    "transports" TEXT,
    "passkey_provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "passkeys_id_idx" ON "public"."passkeys"("id");

-- CreateIndex
CREATE INDEX "passkeys_admin_uuid_idx" ON "public"."passkeys"("admin_uuid");

-- AddForeignKey
ALTER TABLE "public"."passkeys" ADD CONSTRAINT "passkeys_admin_uuid_fkey" FOREIGN KEY ("admin_uuid") REFERENCES "public"."admin"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "subscription_page_config" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "view_position" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "subscription_page_config_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_page_config_name_key" ON "subscription_page_config"("name");

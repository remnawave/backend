-- CreateTable
CREATE TABLE "shared_lists" (
    "name" VARCHAR(255) NOT NULL,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_lists_pkey" PRIMARY KEY ("name")
);

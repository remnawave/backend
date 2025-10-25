-- CreateTable
CREATE TABLE "public"."config_profile_snippets" (
    "name" VARCHAR(255) NOT NULL,
    "snippet" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "config_profile_snippets_pkey" PRIMARY KEY ("name")
);

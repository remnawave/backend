-- 1. Add new column
ALTER TABLE "internal_squad_members" ADD COLUMN "user_id" BIGINT;

-- 2. Copy data from uuid to t_id
UPDATE "internal_squad_members" ism
SET "user_id" = u."t_id"
FROM "users" u
WHERE ism."user_uuid" = u."uuid";

-- 3. NOT NULL
ALTER TABLE "internal_squad_members" ALTER COLUMN "user_id" SET NOT NULL;

-- 4. Delete the old column
ALTER TABLE "internal_squad_members" DROP CONSTRAINT "internal_squad_members_user_uuid_fkey";

DROP INDEX "internal_squad_members_user_uuid_idx";

ALTER TABLE "internal_squad_members" DROP CONSTRAINT "internal_squad_members_pkey";

ALTER TABLE "internal_squad_members" DROP COLUMN "user_uuid";

-- 5. Create new keys and indexes
ALTER TABLE "internal_squad_members" ADD CONSTRAINT "internal_squad_members_pkey" PRIMARY KEY ("internal_squad_uuid", "user_id");

CREATE INDEX "internal_squad_members_user_id_idx" ON "internal_squad_members"("user_id");

ALTER TABLE "internal_squad_members" ADD CONSTRAINT "internal_squad_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("t_id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AlterTable: migrate host tag (single string) to tags (array of strings)

-- Step 1: Add new tags column with default empty array
ALTER TABLE "hosts" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing tag data to tags array
UPDATE "hosts" SET "tags" = ARRAY["tag"] WHERE "tag" IS NOT NULL;

-- Step 3: Drop old tag column
ALTER TABLE "hosts" DROP COLUMN "tag";

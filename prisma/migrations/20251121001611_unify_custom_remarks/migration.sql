-- AlterTable
ALTER TABLE "subscription_settings" ADD COLUMN "custom_remarks" JSONB;

-- Migrate data
UPDATE "subscription_settings"
SET "custom_remarks" = jsonb_build_object(
    'expiredUsers', COALESCE("expired_users_remarks", '[]'::jsonb),
    'limitedUsers', COALESCE("limited_users_remarks", '[]'::jsonb),
    'disabledUsers', COALESCE("disabled_users_remarks", '[]'::jsonb),
    'emptyHosts', '["→ Remnawave", "Did you forget to add hosts?", "→ No hosts found", "→ Check Hosts tab"]'::jsonb,
    'emptyInternalSquads', '["→ Remnawave", "Did you forget to add internal squads?", "→ No internal squads found", "User has no internal squads"]'::jsonb
);

-- AlterTable
ALTER TABLE "subscription_settings" ALTER COLUMN "custom_remarks" SET NOT NULL;

-- Drop old columns
ALTER TABLE "subscription_settings" 
DROP COLUMN "disabled_users_remarks",
DROP COLUMN "expired_users_remarks",
DROP COLUMN "limited_users_remarks";
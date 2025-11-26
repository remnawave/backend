-- AlterTable
ALTER TABLE "subscription_settings" DROP COLUMN "add_username_to_base_subscription";

-- Remove addUsernameToBaseSubscription from JSON in external_squads
UPDATE "external_squads" SET "subscription_settings" = "subscription_settings" - 'addUsernameToBaseSubscription';
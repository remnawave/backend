-- Remove custom_remarks from JSON in external_squads
UPDATE "subscription_settings" SET "custom_remarks" = "custom_remarks" - 'emptyInternalSquads';

-- Remove emptyInternalSquads from JSON in external_squads
UPDATE "external_squads" SET "custom_remarks" = "custom_remarks" - 'emptyInternalSquads';
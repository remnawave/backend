-- 1
UPDATE "external_squads"
SET "custom_remarks" = NULL 
WHERE "custom_remarks" IS NOT NULL AND (jsonb_typeof("custom_remarks") != 'object' OR "custom_remarks" = '{}'::jsonb);

-- 2
UPDATE "external_squads"
SET "hwid_settings" = NULL 
WHERE "hwid_settings" IS NOT NULL AND (jsonb_typeof("hwid_settings") != 'object' OR "hwid_settings" = '{}'::jsonb);

-- 3
UPDATE "external_squads"
SET "subscription_settings" = NULL 
WHERE "subscription_settings" = 'null'::jsonb OR "subscription_settings" = '[]'::jsonb;

-- 4
UPDATE "external_squads"
SET "host_overrides" = NULL 
WHERE "host_overrides" = 'null'::jsonb OR "host_overrides" = '[]'::jsonb;

-- 5
UPDATE "external_squads"
SET "response_headers" = NULL 
WHERE "response_headers" = 'null'::jsonb OR "response_headers" = '[]'::jsonb;

-- ===========================================================================

-- 6
UPDATE "subscription_settings" 
SET "custom_remarks" = "custom_remarks" - 'emptyInternalSquads' 
WHERE "custom_remarks" ? 'emptyInternalSquads';

-- 7
UPDATE "external_squads" 
SET "custom_remarks" = "custom_remarks" - 'emptyInternalSquads' 
WHERE "custom_remarks" ? 'emptyInternalSquads';

-- ===========================================================================

-- 8
UPDATE "external_squads"
SET "custom_remarks" = "custom_remarks" 
    || CASE 
        WHEN NOT ("custom_remarks" ? 'HWIDMaxDevicesExceeded') 
        THEN '{"HWIDMaxDevicesExceeded": ["Limit of devices reached"]}'::jsonb 
        ELSE '{}'::jsonb 
    END
    || CASE 
        WHEN NOT ("custom_remarks" ? 'HWIDNotSupported') 
        THEN '{"HWIDNotSupported": ["App not supported"]}'::jsonb 
        ELSE '{}'::jsonb 
    END
WHERE "custom_remarks" IS NOT NULL
    AND jsonb_typeof("custom_remarks") = 'object';
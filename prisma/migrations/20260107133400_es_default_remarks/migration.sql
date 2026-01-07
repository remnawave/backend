-- Default remarks for external squads
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
WHERE "custom_remarks" IS NOT NULL;
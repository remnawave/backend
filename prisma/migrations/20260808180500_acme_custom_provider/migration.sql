-- The ACME_PROXY provider type became the generic CUSTOM provider (a plain
-- HTTP DNS API). The stored payload shape (baseUrl, token) is unchanged, so
-- only the discriminator moves.
UPDATE "acme_credentials" SET "provider" = 'CUSTOM' WHERE "provider" = 'ACME_PROXY';

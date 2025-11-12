-- 0) nodes.id BIGSERIAL + unique index (if not exists)
ALTER TABLE public."nodes" ADD COLUMN IF NOT EXISTS "id" BIGSERIAL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'nodes_id_key' AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX "nodes_id_key" ON public."nodes"("id");
  END IF;
END$$;

-- 1) CTAS + Swap in dependence of the table size by reltuples
DO $$
DECLARE
  est_rows BIGINT := 0;
  big_table_threshold BIGINT := 5000000;
  do_transfer BOOLEAN := TRUE;
BEGIN
  -- Estimate the number of rows
  SELECT COALESCE(c.reltuples::BIGINT, 0)
  INTO est_rows
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'nodes_user_usage_history';

  do_transfer := est_rows <= big_table_threshold;

  -- Create the target table (always)
  CREATE TABLE public."nodes_user_usage_history_new" (
    "node_id"     BIGINT    NOT NULL,
    "user_id"     BIGINT    NOT NULL,
    "total_bytes" BIGINT    NOT NULL,
    "created_at"  DATE      NOT NULL DEFAULT CURRENT_DATE,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT "nodes_user_usage_history_new_pkey"
      PRIMARY KEY ("node_id","created_at","user_id")
  );

  -- FK as NOT VALID, to not slow down the bulk-insert; validate after swap
  ALTER TABLE public."nodes_user_usage_history_new"
    ADD CONSTRAINT "nodes_user_usage_history_node_id_fkey"
    FOREIGN KEY ("node_id") REFERENCES public."nodes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

  ALTER TABLE public."nodes_user_usage_history_new"
    ADD CONSTRAINT "nodes_user_usage_history_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES public."users"("t_id"
    )
    ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

  IF do_transfer THEN
    -- ≤ 5 million rows: transfer data
    INSERT INTO public."nodes_user_usage_history_new"
      ("node_id","user_id","total_bytes","created_at","updated_at")
    SELECT n."id"       AS node_id,
           u."t_id"     AS user_id,
           h."total_bytes",
           h."created_at",
           h."updated_at"
    FROM   public."nodes_user_usage_history" h
    JOIN   public."nodes"  n ON n."uuid" = h."node_uuid"
    JOIN   public."users"  u ON u."uuid" = h."user_uuid";
  END IF;

  -- Fast swap
  BEGIN
    ALTER TABLE public."nodes_user_usage_history" RENAME TO "nodes_user_usage_history_old";
    ALTER TABLE public."nodes_user_usage_history_new" RENAME TO "nodes_user_usage_history";
  EXCEPTION WHEN undefined_table THEN
    -- If the old table did not exist (just in case)
    ALTER TABLE public."nodes_user_usage_history_new" RENAME TO "nodes_user_usage_history";
  END;

END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='nodes_user_usage_history_old'
  ) THEN
    BEGIN
      ALTER TABLE public."nodes_user_usage_history_old" DROP CONSTRAINT IF EXISTS "nodes_user_usage_history_pkey";
    EXCEPTION WHEN undefined_table THEN
      -- ignore
    END;
  END IF;
END$$;

DO $$
BEGIN
  -- PK
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='nodes_user_usage_history_new_pkey'
  ) THEN
    ALTER TABLE public."nodes_user_usage_history"
      RENAME CONSTRAINT "nodes_user_usage_history_new_pkey" TO "nodes_user_usage_history_pkey";
  END IF;

END$$;


-- 2) Validate foreign keys on the new table
ALTER TABLE public."nodes_user_usage_history" VALIDATE CONSTRAINT "nodes_user_usage_history_node_id_fkey";
ALTER TABLE public."nodes_user_usage_history" VALIDATE CONSTRAINT "nodes_user_usage_history_user_id_fkey";


-- 3) Drop the old table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'nodes_user_usage_history_old'
  ) THEN
    DROP TABLE public."nodes_user_usage_history_old";
  END IF;
END$$;


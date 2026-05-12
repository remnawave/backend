-- Add Veil-vs-Xray dispatch column to the Nodes table.
--
-- Existing rows default to 'XRAY' so the migration is a no-op for
-- everyone who hasn't onboarded a Veil node yet. The default is also
-- pinned at the DB level so direct INSERTs (admin bash scripts, the
-- seed script, etc.) keep working without specifying the column.
CREATE TYPE "node_core" AS ENUM ('XRAY', 'VEIL');

ALTER TABLE "nodes"
  ADD COLUMN "core" "node_core" NOT NULL DEFAULT 'XRAY';

-- Hot-path: most queue processors look up the core to decide which
-- axios method to call, so an index keeps single-node lookups
-- cheap even with hundreds of registered nodes.
CREATE INDEX "nodes_core_idx" ON "nodes" ("core");

-- CreateTable
CREATE TABLE "torrent_blocker_reports" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "node_id" BIGINT NOT NULL,
    "report" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "torrent_blocker_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "torrent_blocker_reports" ADD CONSTRAINT "torrent_blocker_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("t_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torrent_blocker_reports" ADD CONSTRAINT "torrent_blocker_reports_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

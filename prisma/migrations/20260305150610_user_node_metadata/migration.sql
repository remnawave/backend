-- CreateTable
CREATE TABLE "user_meta" (
    "user_id" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "user_meta_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "node_meta" (
    "node_id" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "node_meta_pkey" PRIMARY KEY ("node_id")
);

-- AddForeignKey
ALTER TABLE "user_meta" ADD CONSTRAINT "user_meta_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("t_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_meta" ADD CONSTRAINT "node_meta_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

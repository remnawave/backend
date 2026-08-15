CREATE TABLE "abuse_blocker_reports" (
    "event_id" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "node_id" BIGINT NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "score" INTEGER NOT NULL,
    "source_ip" VARCHAR(45) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL,
    "report" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abuse_blocker_reports_pkey" PRIMARY KEY ("event_id")
);

CREATE TABLE "abuse_blocker_user_state" (
    "user_id" BIGINT NOT NULL,
    "strike_level" INTEGER NOT NULL DEFAULT 0,
    "last_blocking_incident_at" TIMESTAMP(3),
    "manual_review_required" BOOLEAN NOT NULL DEFAULT false,
    "disabled_by_plugin" BOOLEAN NOT NULL DEFAULT false,
    "review_requested_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "review_action" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abuse_blocker_user_state_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "abuse_blocker_reports_user_id_detected_at_idx"
    ON "abuse_blocker_reports"("user_id", "detected_at");
CREATE INDEX "abuse_blocker_reports_node_id_detected_at_idx"
    ON "abuse_blocker_reports"("node_id", "detected_at");
CREATE INDEX "abuse_blocker_reports_severity_detected_at_idx"
    ON "abuse_blocker_reports"("severity", "detected_at");
CREATE INDEX "abuse_blocker_reports_action_detected_at_idx"
    ON "abuse_blocker_reports"("action", "detected_at");
CREATE INDEX "abuse_blocker_user_state_manual_review_required_updated_at_idx"
    ON "abuse_blocker_user_state"("manual_review_required", "updated_at");

ALTER TABLE "abuse_blocker_reports"
    ADD CONSTRAINT "abuse_blocker_reports_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "abuse_blocker_reports"
    ADD CONSTRAINT "abuse_blocker_reports_node_id_fkey"
    FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "abuse_blocker_user_state"
    ADD CONSTRAINT "abuse_blocker_user_state_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "user_subscription_request_history" ADD COLUMN     "srr_response_type" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "srr_rule_name" TEXT;

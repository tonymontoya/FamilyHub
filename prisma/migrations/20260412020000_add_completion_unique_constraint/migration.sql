-- Add unique constraint for idempotency
-- One completion per chore per member per day
CREATE UNIQUE INDEX "unique_completion_per_day"
ON "completions"("chore_id", "member_id", "scheduled_for");

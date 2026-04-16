-- AlterTable
ALTER TABLE "event_reminders" ADD COLUMN     "acknowledged_at" TIMESTAMP(3),
ADD COLUMN     "is_acknowledged" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "event_reminders_is_sent_sent_at_idx" ON "event_reminders"("is_sent", "sent_at");

-- CreateIndex
CREATE INDEX "event_reminders_is_acknowledged_is_sent_idx" ON "event_reminders"("is_acknowledged", "is_sent");

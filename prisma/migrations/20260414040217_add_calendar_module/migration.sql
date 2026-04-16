-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('EVENT', 'APPOINTMENT', 'ACTIVITY', 'BIRTHDAY', 'HOLIDAY', 'REMINDER');

-- CreateEnum
CREATE TYPE "AttendeeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('BROWSER', 'EMAIL', 'PUSH');

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000),
    "start_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" TEXT,
    "recurrence_end" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "assignee_ids" TEXT[],
    "is_family_wide" BOOLEAN NOT NULL DEFAULT true,
    "type" "EventType" NOT NULL DEFAULT 'EVENT',
    "location" VARCHAR(500),
    "color" VARCHAR(7),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "status" "AttendeeStatus" NOT NULL DEFAULT 'ACCEPTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_exceptions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "original_date" TIMESTAMP(3) NOT NULL,
    "title" VARCHAR(200),
    "description" VARCHAR(2000),
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "location" VARCHAR(500),
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reminders" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "minutes_before" INTEGER NOT NULL,
    "type" "ReminderType" NOT NULL DEFAULT 'BROWSER',
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_family_id_start_date_idx" ON "calendar_events"("family_id", "start_date");

-- CreateIndex
CREATE INDEX "calendar_events_family_id_deleted_at_idx" ON "calendar_events"("family_id", "deleted_at");

-- CreateIndex
CREATE INDEX "calendar_events_is_recurring_recurrence_end_idx" ON "calendar_events"("is_recurring", "recurrence_end");

-- CreateIndex
CREATE INDEX "event_attendees_member_id_idx" ON "event_attendees"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_event_id_member_id_key" ON "event_attendees"("event_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_exceptions_event_id_original_date_key" ON "event_exceptions"("event_id", "original_date");

-- CreateIndex
CREATE INDEX "event_reminders_event_id_is_sent_idx" ON "event_reminders"("event_id", "is_sent");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `updated_at` to the `completions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "completions_chore_id_created_at_idx";

-- AlterTable
ALTER TABLE "completions" ADD COLUMN     "scheduled_for" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "completions_chore_id_member_id_completed_at_idx" ON "completions"("chore_id", "member_id", "completed_at");

-- CreateIndex
CREATE INDEX "completions_chore_id_status_idx" ON "completions"("chore_id", "status");

-- AddForeignKey
ALTER TABLE "completions" ADD CONSTRAINT "completions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

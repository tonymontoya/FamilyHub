/*
  Warnings:

  - You are about to alter the column `name` on the `list_items` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `notes` on the `list_items` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `title` on the `lists` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `description` on the `lists` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - Added the required column `updated_at` to the `list_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "list_items" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "notes" SET DATA TYPE VARCHAR(200);

-- AlterTable
ALTER TABLE "lists" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- CreateIndex
CREATE INDEX "list_items_list_id_deleted_at_idx" ON "list_items"("list_id", "deleted_at");

-- CreateIndex
CREATE INDEX "list_items_completed_by_id_idx" ON "list_items"("completed_by_id");

-- CreateIndex
CREATE INDEX "lists_family_id_deleted_at_idx" ON "lists"("family_id", "deleted_at");

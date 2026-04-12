-- CreateEnum
CREATE TYPE "ListType" AS ENUM ('SHOPPING', 'PACKING', 'WISHLIST', 'CUSTOM');

-- CreateTable
CREATE TABLE "lists" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ListType" NOT NULL DEFAULT 'CUSTOM',
    "description" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "list_items" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_by_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lists_family_id_type_idx" ON "lists"("family_id", "type");

-- CreateIndex
CREATE INDEX "lists_updated_at_idx" ON "lists"("updated_at");

-- CreateIndex
CREATE INDEX "list_items_list_id_completed_idx" ON "list_items"("list_id", "completed");

-- CreateIndex
CREATE INDEX "list_items_sort_order_idx" ON "list_items"("sort_order");

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "unique_completion_per_day" RENAME TO "completions_chore_id_member_id_scheduled_for_key";

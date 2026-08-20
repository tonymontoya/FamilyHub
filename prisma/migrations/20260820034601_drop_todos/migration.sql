/*
  Warnings:

  - You are about to drop the `todos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "todos" DROP CONSTRAINT "todos_assignee_id_fkey";

-- DropForeignKey
ALTER TABLE "todos" DROP CONSTRAINT "todos_family_id_fkey";

-- DropTable
DROP TABLE "todos";

-- DropEnum
DROP TYPE "TodoStatus";

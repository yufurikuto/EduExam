/*
  Warnings:

  - A unique constraint covering the columns `[name,teacherId]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `teacherId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Subject_name_key";

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "teacherId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "teacherId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_teacherId_key" ON "Subject"("name", "teacherId");

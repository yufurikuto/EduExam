-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- DATA MIGRATION: Insert default teacher if none exists to handle existing data
INSERT INTO "Teacher" ("id", "email", "password", "name", "createdAt")
VALUES ('default_teacher_id', 'admin@example.com', '$2a$10$X7.X7.X7.X7.X7.X7.X7.X7.X7.X7.X7.X7', 'System Admin', NOW())
ON CONFLICT DO NOTHING;

-- DATA MIGRATION: Update existing orphaned records to point to default teacher
UPDATE "Subject" SET "teacherId" = 'default_teacher_id' WHERE "teacherId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Teacher" WHERE "id" = "Subject"."teacherId");
UPDATE "Exam" SET "teacherId" = 'default_teacher_id' WHERE "teacherId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Teacher" WHERE "id" = "Exam"."teacherId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

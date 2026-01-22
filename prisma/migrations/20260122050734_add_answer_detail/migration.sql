-- CreateTable
CREATE TABLE "AnswerDetail" (
    "id" TEXT NOT NULL,
    "examResultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "teacherComment" TEXT,
    "isManualGraded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerDetail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnswerDetail" ADD CONSTRAINT "AnswerDetail_examResultId_fkey" FOREIGN KEY ("examResultId") REFERENCES "ExamResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerDetail" ADD CONSTRAINT "AnswerDetail_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

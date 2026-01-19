'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './auth';

export type Exam = {
    id: string;
    title: string;
    description: string | null;
    subjectId: string;
    timeLimit: number | null;
    passingScore: number | null;
    isShuffle: boolean;
    createdAt: Date;
    updatedAt: Date;
    questions?: Question[];
    subject?: { name: string; color: string | null };
};

export type Question = {
    id: string;
    text: string;
    type: string;
    options: any;
    correctAnswer: string | null;
    imageUrl: string | null;
    score: number;
};

// 試験一覧取得
export async function getExams(subjectId?: string): Promise<any[]> {
    try {
        const teacherId = await requireAuth();
        const where: any = { teacherId };
        if (subjectId && subjectId !== 'all') {
            where.subjectId = subjectId;
        }

        const exams = await prisma.exam.findMany({
            where,
            include: {
                subject: true,
                _count: { select: { questions: true } }
            },
            orderBy: { updatedAt: 'desc' },
        });
        return exams;
    } catch (error) {
        console.error('Failed to get exams:', error);
        return [];
    }
}

// 試験の作成
export async function createExam(data: {
    title: string;
    subjectId: string;
    description?: string;
    timeLimit?: number;
    passingScore?: number;
    isShuffle?: boolean;
}): Promise<{ success: boolean; examId?: string; error?: string }> {
    try {
        const teacherId = await requireAuth();
        const exam = await prisma.exam.create({
            data: {
                title: data.title,
                subjectId: data.subjectId,
                description: data.description,
                timeLimit: data.timeLimit,
                passingScore: data.passingScore,
                isShuffle: data.isShuffle || false,
                teacherId,
            },
        });
        revalidatePath('/teacher/dashboard');
        return { success: true, examId: exam.id };
    } catch (error) {
        console.error('Failed to create exam:', error);
        return { success: false, error: '試験の作成に失敗しました。' };
    }
}

// 試験の取得 (先生用・編集モード)
export async function getExam(id: string): Promise<any> {
    try {
        const teacherId = await requireAuth();
        const exam = await prisma.exam.findUnique({
            where: { id },
            include: {
                subject: true,
                questions: {
                    orderBy: { id: 'asc' }
                }
            },
        });

        // Security check
        if (exam && exam.teacherId !== teacherId) {
            return null;
        }

        return exam;
    } catch (error) {
        console.error('Failed to get exam:', error);
        return null;
    }
}

// 試験の取得 (生徒用・公開モード) - 教師IDチェックなし
export async function getStudentExam(id: string): Promise<any> {
    try {
        const exam = await prisma.exam.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: { id: 'asc' }
                }
            },
        });

        if (!exam) return null;

        // Security: Hide correct answers from client
        const secureQuestions = exam.questions.map((q) => ({
            ...q,
            correctAnswer: null, // Hide answer
        }));

        return {
            ...exam,
            questions: secureQuestions
        };
    } catch (error) {
        console.error('Failed to get student exam:', error);
        return null;
    }
}

// 質問の更新 (一括保存用)
export async function saveExamQuestions(examId: string, questions: Omit<Question, 'id' | 'examId'>[]) {
    try {
        const teacherId = await requireAuth();

        // Check ownership first
        const exam = await prisma.exam.findUnique({ where: { id: examId } });
        if (!exam || exam.teacherId !== teacherId) {
            return { success: false, error: '権限がありません。' };
        }

        await prisma.$transaction(async (tx: any) => {
            // 既存の質問を全て削除
            await tx.question.deleteMany({
                where: { examId },
            });

            // 新しい質問を作成
            if (questions.length > 0) {
                await tx.question.createMany({
                    data: questions.map((q) => ({
                        examId,
                        text: q.text,
                        type: q.type,
                        options: q.options || [],
                        correctAnswer: q.correctAnswer,
                        imageUrl: q.imageUrl,
                        score: q.score,
                    })),
                });
            }

            // Update updatedAt
            await tx.exam.update({
                where: { id: examId },
                data: { updatedAt: new Date() }
            });
        });

        revalidatePath(`/teacher/exam/${examId}/edit`);
        return { success: true };
    } catch (error) {
        console.error('Failed to save questions:', error);
        return { success: false, error: '問題の保存に失敗しました。' };
    }
}

// 試験結果の提出 (サーバーサイド採点)
export async function submitExam(data: {
    examId: string;
    studentName: string;
    studentNumber: string;
    studentClass: string;
    // score: number; // Client calculated score is ignored/removed
    answers: Record<string, string>;
    isPreview?: boolean;
}): Promise<{ success: boolean; score?: number; totalScore?: number; error?: string }> {
    try {
        // Fetch exam with correct answers
        const exam = await prisma.exam.findUnique({
            where: { id: data.examId },
            include: { questions: true }
        });

        if (!exam) return { success: false, error: '試験が見つかりません。' };

        // Server-side Grading Logic
        let earnedScore = 0;
        let totalScore = 0;

        exam.questions.forEach((q) => {
            totalScore += q.score;
            const userAnswer = data.answers[q.id];

            if (!userAnswer || !q.correctAnswer) return;

            let isCorrect = false;

            if (q.type === 'MULTIPLE_CHOICE') {
                // Handle JSON array comparison
                try {
                    // Try parsing both as JSON
                    const userArr = JSON.parse(userAnswer);
                    const correctArr = JSON.parse(q.correctAnswer);

                    if (Array.isArray(userArr) && Array.isArray(correctArr)) {
                        // Sort and compare arrays
                        if (JSON.stringify(userArr.sort()) === JSON.stringify(correctArr.sort())) {
                            isCorrect = true;
                        }
                    } else {
                        // Fallback to simple comparison if not array
                        if (String(userArr) === String(correctArr)) isCorrect = true;
                    }
                } catch {
                    // Fallback string strict comparison
                    if (userAnswer === q.correctAnswer) isCorrect = true;
                }
            } else if (q.type === 'TRUE_FALSE') {
                // Simple string comparison ("true" or "false")
                if (userAnswer === q.correctAnswer) isCorrect = true;
            } else {
                // TEXT, FILL_IN_THE_BLANK, ORDERING, MATCHING
                // Simple strict comparison for now. 
                // In future: trim(), normalize, case-insensitivity options usually go here.
                if (userAnswer.trim() === q.correctAnswer.trim()) {
                    isCorrect = true;
                }
            }

            if (isCorrect) {
                earnedScore += q.score;
            }
        });

        if (data.isPreview) {
            return { success: true, score: earnedScore, totalScore };
        }

        await prisma.examResult.create({
            data: {
                examId: data.examId,
                studentName: data.studentName,
                studentNumber: data.studentNumber,
                studentClass: data.studentClass,
                score: earnedScore, // Use server calculated score
                answers: data.answers,
            },
        });
        return { success: true, score: earnedScore, totalScore };
    } catch (error) {
        console.error('Failed to submit exam:', error);
        return { success: false, error: '送信に失敗しました。' };
    }
}

// 結果一覧取得 (先生用)
export async function getExamResults(examId: string, options?: {
    sortBy?: 'score' | 'submittedAt' | 'studentNumber' | 'studentClass';
    sortOrder?: 'asc' | 'desc';
    query?: string;
}): Promise<any[]> {
    try {
        const teacherId = await requireAuth();
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
        });

        if (!exam || exam.teacherId !== teacherId) {
            return [];
        }

        const where: any = { examId };
        if (options?.query) {
            where.OR = [
                { studentName: { contains: options.query } },
                { studentNumber: { contains: options.query } },
                { studentClass: { contains: options.query } }
            ];
        }

        const orderBy: any = {};
        if (options?.sortBy) {
            orderBy[options.sortBy] = options.sortOrder || 'desc';
        } else {
            orderBy.submittedAt = 'desc';
        }

        const results = await prisma.examResult.findMany({
            where,
            orderBy,
        });

        return results;
    } catch (error) {
        console.error('Failed to get exam results:', error);
        return [];
    }
}

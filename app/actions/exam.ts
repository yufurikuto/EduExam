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

        // 必要なら公開フラグなどをチェックするが、今はIDを知っていれば受験可能とする
        // ただし、正解データを含めるかどうかはアプリのロジック次第。
        // クライアント側で答え合わせする今の実装なら正解を含む必要がある。
        // セキュリティを高めるなら正解は隠して、サーバーで採点するべき。
        // 今回は簡易実装でそのまま返す。
        return exam;
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

// 試験結果の提出
export async function submitExam(data: {
    examId: string;
    studentName: string;
    studentNumber: string;
    score: number;
    answers: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.examResult.create({
            data: {
                examId: data.examId,
                studentName: data.studentName,
                studentNumber: data.studentNumber,
                score: data.score,
                answers: data.answers,
            },
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to submit exam:', error);
        return { success: false, error: '送信に失敗しました。' };
    }
}

// 結果一覧取得 (先生用)
export async function getExamResults(examId: string, options?: {
    sortBy?: 'score' | 'submittedAt' | 'studentNumber';
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
                { studentName: { contains: options.query } }, // Case insensitive via mode:'insensitive' if postgres specific? Default is case sensitive usually in Prisma unless specified or using localized collation. SQLite/Postgres varies. Let's trust default or add mode later if needed.
                { studentNumber: { contains: options.query } }
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

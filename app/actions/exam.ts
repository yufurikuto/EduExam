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
    className?: string; // New
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
                className: data.className, // New
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

// 試験設定の更新
export async function updateExamSettings(examId: string, data: {
    title: string;
    description?: string;
    timeLimit?: number;
    passingScore?: number;
    isShuffle?: boolean;
    className?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const teacherId = await requireAuth();
        const exam = await prisma.exam.findUnique({ where: { id: examId } });

        if (!exam || exam.teacherId !== teacherId) {
            return { success: false, error: '権限がありません。' };
        }

        await prisma.exam.update({
            where: { id: examId },
            data: {
                title: data.title,
                description: data.description,
                timeLimit: data.timeLimit,
                passingScore: data.passingScore,
                isShuffle: data.isShuffle,
                className: data.className,
            }
        });

        revalidatePath(`/teacher/exam/${examId}/edit`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update exam settings:', error);
        return { success: false, error: '設定の更新に失敗しました。' };
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

        // Security: Hide correct answers from client but expose necessity meta-data
        const secureQuestions = exam.questions.map((q) => {
            const isMultiple = q.type === 'MULTIPLE_CHOICE' && q.correctAnswer?.startsWith("[") || false;
            return {
                ...q,
                correctAnswer: null, // Hide answer
                isMultiple: isMultiple,
            };
        });

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
    answers: Record<string, string>;
    isPreview?: boolean;
}): Promise<{ success: boolean; score?: number; totalScore?: number; error?: string }> {
    try {
        // Fetch exam with correct answers AND className
        const exam = await prisma.exam.findUnique({
            where: { id: data.examId },
            include: { questions: true }
        });

        if (!exam) return { success: false, error: '試験が見つかりません。' };

        // Server-side Grading Logic
        let earnedScore = 0;
        let totalScore = 0;
        const answerDetailsData: any[] = [];

        exam.questions.forEach((q) => {
            totalScore += q.score;
            const userAnswer = data.answers[q.id];

            let isCorrect = false;
            let questionScore = 0;

            if (userAnswer) {
                if (q.type === 'MULTIPLE_CHOICE') {
                    // Handle JSON array comparison
                    try {
                        // Try parsing both as JSON
                        const userArr = JSON.parse(userAnswer);
                        const correctArr = JSON.parse(q.correctAnswer || "[]");

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
                    if (userAnswer.trim() === (q.correctAnswer || "").trim()) {
                        isCorrect = true;
                    }
                }
            }

            if (isCorrect) {
                questionScore = q.score;
                earnedScore += q.score;
            }

            answerDetailsData.push({
                questionId: q.id,
                answer: userAnswer || "",
                isCorrect: isCorrect,
                score: questionScore
            });
        });

        if (data.isPreview) {
            return { success: true, score: earnedScore, totalScore };
        }

        console.log("Submitting exam result:", {
            examId: data.examId,
            studentName: data.studentName,
            class: exam.className, // Use class from Exam
            score: earnedScore
        });

        await prisma.examResult.create({
            data: {
                examId: data.examId,
                studentName: data.studentName,
                studentNumber: data.studentNumber,
                studentClass: exam.className || data.studentClass || '',
                score: earnedScore,
                answers: data.answers,
                answerDetails: {
                    create: answerDetailsData
                }
            },
        });
        return { success: true, score: earnedScore, totalScore };
    } catch (error) {
        console.error('Failed to submit exam:', error);
        return { success: false, error: `送信に失敗しました: ${error instanceof Error ? error.message : String(error)}` };
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

// 手動採点更新 (フェーズ7)
export async function updateAnswerScore(
    examResultId: string,
    answerDetailId: string,
    score: number,
    comment: string,
    isCorrect: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        const teacherId = await requireAuth();

        // Check ownership via ExamResult -> Exam
        const examResult = await prisma.examResult.findUnique({
            where: { id: examResultId },
            include: { exam: true }
        });

        if (!examResult || examResult.exam.teacherId !== teacherId) {
            return { success: false, error: '権限がありません。' };
        }

        // Update AnswerDetail
        await prisma.answerDetail.update({
            where: { id: answerDetailId },
            data: {
                score,
                teacherComment: comment,
                isCorrect,
                isManualGraded: true
            }
        });

        // Recalculate total score for ExamResult
        const allDetails = await prisma.answerDetail.findMany({
            where: { examResultId }
        });

        const newTotalScore = allDetails.reduce((sum, d) => sum + d.score, 0);

        await prisma.examResult.update({
            where: { id: examResultId },
            data: { score: newTotalScore }
        });

        // Revalidate results page
        revalidatePath(`/teacher/exam/${examResult.examId}/results`);

        return { success: true };

    } catch (error) {
        console.error('Failed to update answer score:', error);
        return { success: false, error: '採点の更新に失敗しました。' };
    }
}

// 分析データの取得 (フェーズ7)
export async function getExamAnalysis(examId: string): Promise<any> {
    try {
        const teacherId = await requireAuth();
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { questions: { orderBy: { id: 'asc' } } }
        });

        if (!exam || exam.teacherId !== teacherId) {
            return null;
        }

        const results = await prisma.examResult.findMany({
            where: { examId },
            include: { answerDetails: true }
        });

        if (results.length === 0) {
            return {
                stats: { average: 0, max: 0, min: 0, count: 0 },
                distribution: [],
                questionStats: []
            };
        }

        const scores = results.map(r => r.score);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        const max = Math.max(...scores);
        const min = Math.min(...scores);

        // Distribution (every 10 points)
        const distribution = Array(11).fill(0); // 0-9, 10-19... 100
        scores.forEach(s => {
            const index = Math.min(Math.floor(s / 10), 10);
            distribution[index]++;
        });

        const distributionData = distribution.map((count, i) => ({
            name: i === 10 ? "100" : `${i * 10}~`,
            count
        }));

        // Question Stats
        const questionStats = exam.questions.map(q => {
            let correctCount = 0;
            results.forEach(r => {
                const detail = r.answerDetails.find(ad => ad.questionId === q.id);
                if (detail && detail.isCorrect) correctCount++;
            });
            return {
                id: q.id,
                text: q.text.substring(0, 20) + (q.text.length > 20 ? "..." : ""),
                correctCount,
                totalCount: results.length,
                percentage: Math.round((correctCount / results.length) * 100)
            };
        });

        return {
            stats: {
                average: Math.round(average * 10) / 10,
                max,
                min,
                count: results.length
            },
            distribution: distributionData,
            questionStats
        };

    } catch (error) {
        console.error('Failed to get exam analysis:', error);
        return null;
    }
}

// 結果詳細取得 (フェーズ7)
export async function getExamResultById(resultId: string): Promise<any> {
    try {
        const teacherId = await requireAuth();
        const result = await prisma.examResult.findUnique({
            where: { id: resultId },
            include: {
                answerDetails: {
                    include: { question: true },
                    orderBy: { question: { id: 'asc' } }
                },
                exam: true
            }
        });

        if (!result || result.exam.teacherId !== teacherId) {
            return null;
        }

        return result;
    } catch (error) {
        console.error('Failed to get exam result:', error);
        return null;
    }
}

'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './auth';

export type Subject = {
    id: string;
    name: string;
    color: string | null;
    teacherId: string;
};

export async function getSubjects(): Promise<Subject[]> {
    try {
        const teacherId = await requireAuth();
        const subjects = await prisma.subject.findMany({
            where: { teacherId },
            orderBy: { name: 'asc' },
        });
        return subjects;
    } catch (error) {
        console.error('Failed to fetch subjects:', error);
        return [];
    }
}

export async function createSubject(name: string, color?: string): Promise<{ success: boolean; error?: string; subject?: Subject }> {
    try {
        const teacherId = await requireAuth();
        const subject = await prisma.subject.create({
            data: {
                name,
                color,
                teacherId,
            },
        });
        revalidatePath('/teacher/exam/create');
        return { success: true, subject };
    } catch (error: any) {
        console.error('Failed to create subject:', error);
        if (error.code === 'P2002') {
            return { success: false, error: 'この科目は既に存在します。' };
        }
        return { success: false, error: '科目の作成に失敗しました。' };
    }
}

export async function deleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const teacherId = await requireAuth();
        // Ensure ownership
        const count = await prisma.subject.count({ where: { id, teacherId } });
        if (count === 0) return { success: false, error: '削除権限がありません。' };

        await prisma.subject.delete({
            where: { id },
        });
        revalidatePath('/teacher/exam/create');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete subject:', error);
        return { success: false, error: '科目の削除に失敗しました。' };
    }
}

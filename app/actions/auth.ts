'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'teacher_id';
const COOKIE_DURATION = 60 * 60 * 24 * 7; // 1 week

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: 'メールアドレスとパスワードを入力してください。' };
    }

    try {
        const teacher = await prisma.teacher.findUnique({
            where: { email },
        });

        if (!teacher) {
            return { success: false, error: 'メールアドレスまたはパスワードが間違っています。' };
        }

        const isValid = await bcrypt.compare(password, teacher.password);

        if (!isValid) {
            return { success: false, error: 'メールアドレスまたはパスワードが間違っています。' };
        }

        cookies().set(COOKIE_NAME, teacher.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: COOKIE_DURATION,
            path: '/',
        });

        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'ログイン中にエラーが発生しました。' };
    }
}

export async function register(formData: FormData) {
    const name = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !name) {
        return { success: false, error: '全ての項目を入力してください。' };
    }

    try {
        // Check valid email format simple regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: '有効なメールアドレスを入力してください。' };
        }

        const existing = await prisma.teacher.findUnique({
            where: { email },
        });

        if (existing) {
            return { success: false, error: 'このメールアドレスは既に登録されています。' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newTeacher = await prisma.teacher.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        cookies().set(COOKIE_NAME, newTeacher.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: COOKIE_DURATION,
            path: '/',
        });

        return { success: true };
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: 'アカウント作成中にエラーが発生しました。' };
    }
}

export async function logout() {
    cookies().delete(COOKIE_NAME);
    redirect('/login');
}

export async function getTeacherId() {
    return cookies().get(COOKIE_NAME)?.value || null;
}

export async function requireAuth() {
    const teacherId = await getTeacherId();
    if (!teacherId) {
        redirect('/login');
    }
    return teacherId;
}

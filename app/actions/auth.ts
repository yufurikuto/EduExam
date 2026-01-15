'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;

    // Mock authentication
    if (identifier && password) {
        // Simple hash-like ID generation for consistency (in real app, use DB auth)
        // Here we just use the identifier as the ID for simplicity in this mock
        const teacherId = `teacher_${identifier.replace(/[^a-zA-Z0-9]/g, '')}`;

        cookies().set('teacher_id', teacherId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return { success: true };
    }

    return { success: false, error: 'IDまたはパスワードが間違っています。' };
}

export async function logout() {
    cookies().delete('teacher_id');
    redirect('/login');
}

export async function getTeacherId() {
    const cookieStore = cookies();
    const teacherId = cookieStore.get('teacher_id')?.value;
    if (!teacherId) return null;
    return teacherId;
}

export async function requireAuth() {
    const teacherId = await getTeacherId();
    if (!teacherId) {
        redirect('/login');
    }
    return teacherId;
}

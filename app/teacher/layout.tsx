"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        // ログアウト処理(モック)
        router.push("/login");
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/teacher/dashboard" className="text-xl font-bold text-indigo-600">
                                EduExam Teacher
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-700 mr-4">
                                ようこそ, <span className="font-semibold">先生</span>さん
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-500 hover:text-gray-900"
                            >
                                ログアウト
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            {children}
        </div>
    );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { register } from "@/app/actions/auth";

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const result = await register(formData);

        if (result.success) {
            // Auto login logic handled in server action (cookie set)
            router.push("/teacher/dashboard");
            router.refresh();
        } else {
            setError(result.error || "登録に失敗しました");
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 flex items-center justify-center min-h-screen">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    アカウント作成
                </h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700"
                        >
                            名前 (表示用)
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="山田 太郎"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                        >
                            メールアドレス
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="teacher@example.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            パスワード
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="8文字以上推奨"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            アカウント種別
                        </label>
                        <div className="flex space-x-4">
                            <span className="text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded">教員 (先生)</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400"
                    >
                        {loading ? "登録中..." : "登録する"}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link
                        href="/login"
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                        すでにアカウントをお持ちの方はこちら
                    </Link>
                </div>
            </div>
        </div>
    );
}

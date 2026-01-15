"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // ここで認証ロジックを実装する
        // 現在はモックとしてダッシュボードへリダイレクト
        const formData = new FormData(e.currentTarget);
        const id = formData.get("identifier");
        const password = formData.get("password");

        if (id && password) {
            // 簡易的な遷移
            router.push("/teacher/dashboard");
        } else {
            setError("ID・メールアドレス、またはパスワードが間違っています。");
        }
    };

    return (
        <div className="bg-gray-100 flex items-center justify-center h-screen">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    EduExam ログイン
                </h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="identifier"
                            className="block text-sm font-medium text-gray-700"
                        >
                            ユーザーID / メールアドレス
                        </label>
                        <input
                            type="text"
                            id="identifier"
                            name="identifier"
                            required
                            autoFocus
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="ユーザーID または メールアドレス"
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
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition duration-200"
                    >
                        ログイン
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link
                        href="/register"
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                        アカウント登録はこちら
                    </Link>
                </div>
            </div>
        </div>
    );
}

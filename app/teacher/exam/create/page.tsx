"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUBJECTS = [
    { id: "math", name: "数学" },
    { id: "english", name: "英語" },
    { id: "history", name: "歴史" },
    { id: "science", name: "理科" },
];

export default function CreateExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        // モック: 試験作成APIコール
        setTimeout(() => {
            // 新しいIDを生成したと仮定
            const newId = "exam-" + Date.now();
            router.push(`/teacher/exam/${newId}/edit`);
        }, 1000);
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">
                    新しい試験を作成
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            試験タイトル
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="例: 2024年度 前期中間試験 数学I"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            科目
                        </label>
                        <select
                            name="subjectId"
                            className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            {SUBJECTS.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            説明文 (任意)
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="試験の範囲や注意事項など"
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
                        >
                            {loading ? "作成中..." : "作成して次へ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

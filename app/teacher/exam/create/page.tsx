"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSubjects, type Subject } from "@/app/actions/subject";
import { createExam } from "@/app/actions/exam";
import SubjectManager from "@/components/SubjectManager";

export default function CreateExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        const data = await getSubjects();
        setSubjects(data);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        // Convert FormData to object for server action
        const examData = {
            title: formData.get("title") as string,
            subjectId: formData.get("subjectId") as string,
            description: formData.get("description") as string,
            timeLimit: Number(formData.get("timeLimit")) || undefined,
            passingScore: Number(formData.get("passingScore")) || undefined,
            isShuffle: formData.get("isShuffle") === "on",
            className: (formData.get("className") as string) || undefined,
        };

        const result = await createExam(examData);

        if (result.success && result.examId) {
            router.push(`/teacher/exam/${result.examId}/edit`);
        } else {
            alert(result.error || "作成に失敗しました");
            setLoading(false);
        }
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
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <select
                                name="subjectId"
                                required
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">選択してください</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <SubjectManager subjects={subjects} onUpdate={loadSubjects} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            対象クラス (任意)
                        </label>
                        <input
                            type="text"
                            name="className"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="例: 1年A組"
                        />
                    </div>

                    {/* Advanced Settings */}
                    <div className="bg-gray-50 p-4 rounded-md space-y-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900">詳細設定</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">
                                    制限時間 (分)
                                </label>
                                <input
                                    type="number"
                                    name="timeLimit"
                                    min="0"
                                    defaultValue={60}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">
                                    合格点
                                </label>
                                <input
                                    type="number"
                                    name="passingScore"
                                    min="0"
                                    max="100"
                                    defaultValue={60}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="isShuffle"
                                name="isShuffle"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isShuffle" className="ml-2 block text-sm text-gray-900">
                                問題の順序をシャッフルする
                            </label>
                        </div>
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

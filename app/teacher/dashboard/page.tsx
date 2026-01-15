"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, BarChart2, Edit, Trash2 } from "lucide-react";

// モックデータ
const MOCK_EXAMS = [
    {
        id: "exam-001",
        title: "2024年度 前期中間試験 数学I",
        description: "二次関数、三角比を中心とした出題です。",
        subjectId: "math",
        subjectName: "数学",
        createdAt: "2024-05-20T10:00:00",
    },
    {
        id: "exam-002",
        title: "第1回 英単語小テスト",
        description: "Unit 1-3までの範囲から出題します。",
        subjectId: "english",
        subjectName: "英語",
        createdAt: "2024-05-22T09:30:00",
    },
    {
        id: "exam-003",
        title: "歴史（明治維新〜現代）",
        description: "近代史の重要語句記述問題。",
        subjectId: "history",
        subjectName: "歴史",
        createdAt: "2024-06-01T14:00:00",
    },
];

const SUBJECTS = [
    { id: "math", name: "数学" },
    { id: "english", name: "英語" },
    { id: "history", name: "歴史" },
    { id: "science", name: "理科" },
];

export default function TeacherDashboard() {
    const [exams, setExams] = useState(MOCK_EXAMS);
    const [filterSubject, setFilterSubject] = useState("");

    const filteredExams = exams.filter((exam) => {
        if (!filterSubject) return true;
        return exam.subjectId === filterSubject;
    });

    const handleDelete = (id: string) => {
        if (confirm("本当に削除しますか？")) {
            setExams(exams.filter((e) => e.id !== id));
        }
    };

    const copyExamUrl = (examId: string) => {
        // 実際のデプロイ環境ではwindow.location.originを使う
        const url = `${window.location.origin}/student/exam/${examId}`;
        navigator.clipboard.writeText(url).then(
            () => {
                alert(`受験用URLをコピーしました！\n生徒にこのURLを共有してください。\n\n${url}`);
            },
            (err) => {
                console.error("コピー失敗:", err);
                prompt("以下のURLをコピーしてください:", url);
            }
        );
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">作成した試験一覧</h2>
                <Link
                    href="/teacher/exam/create"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                    ＋ 新しい試験を作成
                </Link>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center">
                    <label className="text-sm text-gray-600 mr-2">科目:</label>
                    <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm text-sm p-2 border"
                    >
                        <option value="">すべて</option>
                        {SUBJECTS.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
                {/* ソート機能は今回は省略（UIのみ） */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExams.map((exam) => (
                    <div
                        key={exam.id}
                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300 border border-gray-100"
                    >
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-medium text-gray-900 truncate">
                                    {exam.title}
                                </h3>
                                {exam.subjectName && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {exam.subjectName}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                {exam.description}
                            </p>
                            <div className="mt-4 flex items-center text-xs text-gray-400">
                                <span className="mr-2">
                                    作成: {new Date(exam.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => copyExamUrl(exam.id)}
                                className="text-gray-500 hover:text-indigo-600 text-sm font-medium flex items-center px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50"
                                title="受験用URLをコピー"
                            >
                                <Copy size={14} className="mr-1" />
                                URL
                            </button>

                            <Link
                                href={`/teacher/exam/${exam.id}/results`}
                                className="text-green-600 hover:text-green-900 text-sm font-medium flex items-center"
                            >
                                <BarChart2 size={16} className="mr-1" /> 成績
                            </Link>

                            <Link
                                href={`/teacher/exam/${exam.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center"
                            >
                                <Edit size={16} className="mr-1" /> 編集
                            </Link>

                            <button
                                onClick={() => handleDelete(exam.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium ml-1 flex items-center"
                            >
                                <Trash2 size={16} /> 削除
                            </button>
                        </div>
                    </div>
                ))}

                {filteredExams.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        試験がまだありません。「新しい試験を作成」ボタンから作成してください。
                    </div>
                )}
            </div>
        </div>
    );
}

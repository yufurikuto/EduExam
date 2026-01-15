"use client";

import { useState } from "react";
import Link from "next/link";

// モックデータ: 生徒の回答結果
const MOCK_RESULTS = [
    {
        studentId: "s001",
        studentName: "佐藤 健太",
        studentIdNum: "2F-15",
        totalScore: 80,
        submittedAt: "2024-05-20T10:45:00",
        status: "GRADED", // 採点済み
        answers: [
            {
                questionId: "q1",
                questionText: "次の2次関数 y = x^2 - 4x + 3 の頂点の座標を求めよ。",
                type: "MULTIPLE_CHOICE",
                maxScore: 10,
                score: 10,
                studentAnswer: "(2, -1)",
                correctAnswer: "(2, -1)",
            },
            {
                questionId: "q2",
                questionText: "日本国憲法が施行された年は？",
                type: "TEXT",
                maxScore: 10,
                score: 10,
                studentAnswer: "1947年",
                correctAnswer: "1947年",
            },
        ],
    },
    {
        studentId: "s002",
        studentName: "鈴木 花子",
        studentIdNum: "2F-22",
        totalScore: 10,
        submittedAt: "2024-05-20T10:52:00",
        status: "PENDING", // 要確認 (部分点など)
        answers: [
            {
                questionId: "q1",
                questionText: "次の2次関数 y = x^2 - 4x + 3 の頂点の座標を求めよ。",
                type: "MULTIPLE_CHOICE",
                maxScore: 10,
                score: 0,
                studentAnswer: "(2, 1)",
                correctAnswer: "(2, -1)",
            },
            {
                questionId: "q2",
                questionText: "日本国憲法が施行された年は？",
                type: "TEXT",
                maxScore: 10,
                score: 0, // 自動採点では0点だが...
                studentAnswer: "昭和22年", // 正解だが表記ゆれ、あるいは部分点対象
                correctAnswer: "1947年",
            },
        ],
    },
];

export default function ExamResultsPage({
    params,
}: {
    params: { id: string };
}) {
    const [results, setResults] = useState(MOCK_RESULTS);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

    // 選択された生徒のデータを取得
    const targetResult = results.find((r) => r.studentId === selectedStudent);

    // 点数更新ハンドラ
    const handleScoreUpdate = (studentId: string, questionId: string, newScore: number) => {
        setResults((prev) =>
            prev.map((r) => {
                if (r.studentId !== studentId) return r;

                // 回答の点数を更新
                const newAnswers = r.answers.map((a) =>
                    a.questionId === questionId ? { ...a, score: newScore } : a
                );

                // 合計点を再計算
                const newTotal = newAnswers.reduce((sum, a) => sum + a.score, 0);

                return { ...r, answers: newAnswers, totalScore: newTotal, status: "GRADED" };
            })
        );
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">成績・採点</h1>
                    <p className="text-gray-500 mt-1">試験ID: {params.id}</p>
                </div>
                <Link
                    href="/teacher/dashboard"
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                >
                    &larr; ダッシュボードに戻る
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 左側: 生徒一覧リスト */}
                <div className="lg:col-span-1 bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900">受験者一覧</h2>
                    </div>
                    <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                        {results.map((result) => (
                            <li
                                key={result.studentId}
                                onClick={() => setSelectedStudent(result.studentId)}
                                className={`cursor-pointer hover:bg-indigo-50 transition p-4 flex justify-between items-center ${selectedStudent === result.studentId ? "bg-indigo-50 border-l-4 border-indigo-600" : ""
                                    }`}
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{result.studentName}</p>
                                    <p className="text-xs text-gray-500">{result.studentIdNum}</p>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.status === "GRADED"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                                    >
                                        {result.totalScore}点
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 右側: 詳細・採点エリア */}
                <div className="lg:col-span-2">
                    {targetResult ? (
                        <div className="bg-white shadow rounded-lg border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{targetResult.studentName} の回答</h2>
                                    <p className="text-sm text-gray-500">提出日時: {new Date(targetResult.submittedAt).toLocaleString()}</p>
                                </div>
                                <div className="text-2xl font-bold text-indigo-600">
                                    {targetResult.totalScore} <span className="text-sm text-gray-500 font-normal">点</span>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                {targetResult.answers.map((ans, idx) => (
                                    <div key={ans.questionId} className="border-b last:border-0 pb-6 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded text-sm">第{idx + 1}問 ({ans.maxScore}点)</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-600">得点:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={ans.maxScore}
                                                    value={ans.score}
                                                    onChange={(e) => handleScoreUpdate(targetResult.studentId, ans.questionId, parseInt(e.target.value) || 0)}
                                                    className="w-16 p-1 text-right border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                                                />
                                                <span className="text-gray-400">/ {ans.maxScore}</span>
                                            </div>
                                        </div>

                                        <p className="mb-3 text-gray-800 font-medium">{ans.questionText}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className={`p-3 rounded border ${ans.score === ans.maxScore
                                                    ? "bg-green-50 border-green-200"
                                                    : ans.score > 0
                                                        ? "bg-yellow-50 border-yellow-200"
                                                        : "bg-red-50 border-red-200"
                                                }`}>
                                                <div className="text-xs text-gray-500 mb-1 font-bold">生徒の回答</div>
                                                <p className={`whitespace-pre-wrap ${ans.score === ans.maxScore ? "text-green-800" : ans.score > 0 ? "text-yellow-800" : "text-red-800"
                                                    }`}>{ans.studentAnswer}</p>
                                            </div>

                                            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                                                <div className="text-xs text-gray-500 mb-1 font-bold">模範解答 / 正解</div>
                                                <p className="text-gray-800 whitespace-pre-wrap">{ans.correctAnswer}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-white shadow rounded-lg border border-gray-200 text-gray-500 p-10">
                            左のリストから生徒を選択して採点を開始してください。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

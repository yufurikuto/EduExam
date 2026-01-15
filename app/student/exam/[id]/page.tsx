"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import OrderingQuestion from "@/components/OrderingQuestion";
import MatchingQuestion from "@/components/MatchingQuestion";
import FillInTheBlankQuestion from "@/components/FillInTheBlankQuestion";

// モックデータ: 受験用
type Question = {
    id: string;
    text: string;
    type: string;
    score: number;
    options?: string[];
    imageUrl?: string;
};

const MOCK_QUESTIONS: Question[] = [
    {
        id: "q1",
        text: "次の2次関数 y = x^2 - 4x + 3 の頂点の座標を求めよ。",
        type: "MULTIPLE_CHOICE",
        score: 10,
        options: ["(2, -1)", "(2, 1)", "(-2, -1)", "(-2, 1)"],
    },
    {
        id: "q2",
        text: "日本国憲法が施行された年は？",
        type: "TEXT",
        score: 10,
    },
    {
        id: "q3",
        text: "次の歴史的出来事を古い順に並べ替えよ。",
        type: "ORDERING",
        score: 10,
        options: ["明治維新", "大政奉還", "西南戦争", "日露戦争"],
    },
    {
        id: "q4",
        text: "次の英単語と意味を結びつけよ。",
        type: "MATCHING",
        score: 10,
        options: [
            JSON.stringify({ left: "Apple", right: "りんご" }),
            JSON.stringify({ left: "Banana", right: "バナナ" }),
            JSON.stringify({ left: "Orange", right: "みかん" }),
        ],
    },
    {
        id: "q5",
        text: "日本で一番高い山は {富士山} で、標高は {3776} メートルです。",
        type: "FILL_IN_THE_BLANK",
        score: 10,
    }
];

export default function StudentExamPage({
    params,
}: {
    params: { id: string };
}) {
    const router = useRouter();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    // 回答更新
    const handleAnswerChange = (qId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [qId]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (confirm("試験を終了して回答を送信しますか？")) {
            setIsSubmitted(true);
            // ここで送信API
            setTimeout(() => {
                alert("送信しました！お疲れ様でした。");
            }, 1000);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
                    <div className="text-5xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold mb-2">送信完了</h1>
                    <p className="text-gray-600">お疲れ様でした。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="font-bold text-gray-800">2024年度 前期中間試験</h1>
                    <div className="text-sm text-gray-500">受験中...</div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {MOCK_QUESTIONS.map((q, idx) => (
                        <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="flex justify-between mb-4">
                                <span className="font-bold text-lg text-indigo-900 border-b-2 border-indigo-500 pb-1">
                                    第{idx + 1}問
                                </span>
                                <span className="text-sm text-gray-500">（配点 {q.score}点）</span>
                            </div>

                            {q.type !== "FILL_IN_THE_BLANK" && (
                                <p className="mb-6 text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">{q.text}</p>
                            )}

                            {/* 問題文画像があれば表示 */}
                            {q.imageUrl && (
                                <div className="mb-6">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={q.imageUrl} alt="Question Reference" className="max-h-64 rounded border border-gray-200" />
                                </div>
                            )}

                            <div className="bg-gray-50 p-4 rounded-lg">
                                {q.type === "FILL_IN_THE_BLANK" && (
                                    <FillInTheBlankQuestion
                                        questionId={q.id}
                                        text={q.text}
                                        onAnswerChange={(val) => handleAnswerChange(q.id, JSON.stringify(val))}
                                    />
                                )}

                                {q.type === "MULTIPLE_CHOICE" && q.options && (
                                    <div className="space-y-3">
                                        {q.options.map((opt, i) => (
                                            <label key={i} className="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-indigo-50 transition">
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    value={i + 1}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="ml-3 text-gray-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.type === "TEXT" && (
                                    <textarea
                                        rows={4}
                                        className="w-full p-3 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="ここに回答を入力してください..."
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    ></textarea>
                                )}

                                {q.type === "ORDERING" && q.options && (
                                    <OrderingQuestion
                                        questionId={q.id}
                                        options={q.options}
                                        onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                                    />
                                )}

                                {q.type === "MATCHING" && q.options && (
                                    <MatchingQuestion
                                        questionId={q.id}
                                        pairs={q.options.map((opt) => {
                                            try {
                                                return JSON.parse(opt);
                                            } catch {
                                                return { left: opt, right: opt };
                                            }
                                        })}
                                        onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center shadow-lg">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-105"
                        >
                            回答を送信する
                        </button>
                    </div>
                    <div className="h-20"></div>
                </form>
            </main>
        </div>
    );
}

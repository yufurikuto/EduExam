"use client";

import { useState } from "react";
import { Plus, Edit2, Archive, Trash2 } from "lucide-react";
import QuestionForm from "@/components/QuestionForm";

// 型定義
type Question = {
    id: string;
    text: string;
    type: "MULTIPLE_CHOICE" | "TEXT" | "TRUE_FALSE" | "MATCHING" | "ORDERING" | "FILL_IN_THE_BLANK";
    score: number;
    options?: string[];
    correctAnswer?: string;
    imageUrl?: string;
};

export default function ExamEditorPage({
    params,
}: {
    params: { id: string };
}) {
    const [exam, setExam] = useState({
        id: params.id,
        title: "2024年度 前期中間試験 数学I",
        description: "モックデータ: 二次関数",
    });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // 新規追加
    const handleAddQuestion = () => {
        // 一時的にIDを作成してリストに追加し、編集モードにする
        const newId = "q-" + Date.now();
        const newQ: Question = {
            id: newId,
            text: "",
            type: "MULTIPLE_CHOICE",
            score: 10,
            options: ["", "", "", ""],
        };
        setQuestions([...questions, newQ]);
        setEditingId(newId);
    };

    const handleSave = (updatedQ: Question) => {
        setQuestions(questions.map((q) => (q.id === updatedQ.id ? updatedQ : q)));
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm("削除してもよろしいですか？")) {
            setQuestions(questions.filter(q => q.id !== id));
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
                <p className="text-gray-500 mt-2">{exam.description}</p>
            </div>

            <div className="space-y-6">
                {questions.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500">まだ問題がありません</p>
                        <p className="text-sm text-gray-400 mt-1">
                            下のボタンから問題を追加してください
                        </p>
                    </div>
                )}

                {questions.map((q, idx) => (
                    <div key={q.id}>
                        {editingId === q.id ? (
                            <QuestionForm
                                question={q}
                                onSave={handleSave}
                                onCancel={() => {
                                    // 新規作成中のキャンセルなら削除、既存なら編集終了
                                    if (q.text === "") {
                                        setQuestions(questions.filter(qi => qi.id !== q.id));
                                    }
                                    setEditingId(null);
                                }}
                            />
                        ) : (
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group relative hover:border-indigo-300 transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-bold text-gray-700 mr-2">第{idx + 1}問</span>
                                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">
                                            {q.type}
                                        </span>
                                        <span className="text-sm font-semibold text-indigo-600">
                                            {q.score}点
                                        </span>
                                    </div>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingId(q.id)}
                                            className="p-1 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-2 text-gray-800 whitespace-pre-wrap">{q.text}</p>
                                {q.type === "MULTIPLE_CHOICE" && q.options && (
                                    <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-1">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className={`text-sm ${String(i + 1) === q.correctAnswer ? "text-green-600 font-bold" : "text-gray-600"}`}>
                                                {String(i + 1) === q.correctAnswer ? "✓ " : "・ "}{opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center pb-20">
                <button
                    onClick={handleAddQuestion}
                    className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition"
                >
                    <Plus className="mr-2" />
                    新しい問題を追加
                </button>
            </div>
        </div>
    );
}

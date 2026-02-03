"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Archive, Trash2, Save, Upload, ArrowLeft, Settings } from "lucide-react";
import QuestionForm from "@/components/QuestionForm";
import QuestionImportFromExam from "@/components/QuestionImportFromExam";
import { getExam, saveExamQuestions, updateExamSettings, type Question as DBQuestion } from "@/app/actions/exam";
import ExamSettingsModal from "@/components/ExamSettingsModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";

// 型定義 (DBQuestionと合わせる)
type Question = {
    id: string;
    text: string;
    type: string; // "MULTIPLE_CHOICE" | "TEXT" | ...
    score: number;
    options?: string[]; // DBはJsonだがここでは配列として扱う
    correctAnswer?: string;
    imageUrl?: string;
};

export default function ExamEditorPage({
    params,
}: {
    params: { id: string };
}) {
    const router = useRouter();
    const [exam, setExam] = useState<any>(null); // DB型に合わせるべきだが一旦any
    const [questions, setQuestions] = useState<Question[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadExam();
    }, [params.id]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    const loadExam = async () => {
        const data = await getExam(params.id);
        if (data) {
            setExam(data);
            if (data.questions) {
                // DBの型をUIの型に変換 (optionsがJsonなのでキャスト)
                const mappedQuestions = data.questions.map((q: any) => ({
                    id: q.id,
                    text: q.text,
                    type: q.type,
                    score: q.score,
                    options: q.options as string[],
                    correctAnswer: q.correctAnswer || undefined,
                    imageUrl: q.imageUrl || undefined,
                }));
                // Sort by default DB order (which is usually insertion order if not specified, 
                // but we should probably respect the order we receive)
                setQuestions(mappedQuestions);
            }
        } else {
            // 権限がない、または存在しない
            alert("試験が見つかりません。");
            router.push("/teacher/dashboard");
        }
        setLoading(false);
    };

    const handleSaveDatabase = async () => {
        setSaving(true);
        // クライアント側のIDは無視せず、サーバーで差分更新を行うために送信する
        const questionsToSave = questions.map(q => ({
            id: q.id, // IDを含めて送信
            text: q.text,
            type: q.type,
            score: q.score,
            options: q.options || [],
            correctAnswer: q.correctAnswer || null,
            imageUrl: q.imageUrl || null
        }));

        const result = await saveExamQuestions(params.id, questionsToSave);
        if (result.success) {
            await loadExam(); // 再読み込みしてID同期
            setIsDirty(false);
            alert("保存しました！");
        } else {
            alert(result.error || "保存に失敗しました");
        }
        setSaving(false);
    };

    // 新規追加
    const handleAddQuestion = () => {
        const newId = "new-" + Date.now();
        const newQ: Question = {
            id: newId,
            text: "",
            type: "MULTIPLE_CHOICE",
            score: 10,
            options: ["", "", "", ""],
        };
        setQuestions([...questions, newQ]);
        setEditingId(newId);
        setIsDirty(true);
    };

    const handleSaveLocal = (updatedQ: Question) => {
        setQuestions(questions.map((q) => (q.id === updatedQ.id ? updatedQ : q)));
        setEditingId(null);
        setIsDirty(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("削除してもよろしいですか？")) {
            setQuestions(questions.filter(q => q.id !== id));
            setIsDirty(true);
        }
    };

    const handleImportQuestions = (newQuestions: any[]) => {
        // Map imported questions to current format
        const formatted = newQuestions.map(q => ({
            id: q.id || "import-" + Math.random(),
            text: q.text,
            type: q.type,
            score: q.score,
            options: q.options,
            correctAnswer: q.correctAnswer,
            imageUrl: q.imageUrl
        }));
        setQuestions([...questions, ...formatted]);
        setShowImport(false);
        setIsDirty(true);
        alert(`${formatted.length}件の問題を追加しました。\n保存ボタンを押して確定してください。`);
    };

    const handleImport = () => {
        setShowImport(true);
    };

    const handleSaveSettings = async (data: any) => {
        const result = await updateExamSettings(params.id, data);
        if (result.success) {
            setExam((prev: any) => ({ ...prev, ...data }));
            alert("設定を更新しました");
        } else {
            throw new Error(result.error);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
            setIsDirty(true);
        }
    };

    if (loading) return <div className="p-10 text-center">読み込み中...</div>;

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex justify-between items-start border-b pb-4">
                <div>
                    <Link href="/teacher/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" /> ダッシュボードに戻る
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">{exam?.title}</h1>
                    <p className="text-gray-500 mt-2">{exam?.description}</p>
                    {exam?.subject && (
                        <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {exam.subject.name}
                        </span>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleImport}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        過去問からコピー
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        設定編集
                    </button>
                    <button
                        onClick={handleSaveDatabase}
                        disabled={saving}
                        className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isDirty ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
                            } disabled:opacity-50`}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "保存中..." : isDirty ? "保存する (未保存あり)" : "保存済み"}
                    </button>
                </div>
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

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={questions.map((q) => q.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {questions.map((q, idx) => (
                            <SortableItem
                                key={q.id}
                                id={q.id}
                                className="mb-4"
                                onClick={() => {
                                    if (editingId !== q.id) {
                                        setEditingId(q.id);
                                    }
                                }}
                            >
                                {editingId === q.id ? (
                                    <div onPointerDown={(e) => e.stopPropagation()} className="cursor-default">
                                        <QuestionForm
                                            question={q as any} // 型互換のためキャスト
                                            onSave={handleSaveLocal}
                                            onCancel={() => {
                                                if (q.text === "") {
                                                    setQuestions(questions.filter(qi => qi.id !== q.id));
                                                }
                                                setEditingId(null);
                                            }}
                                        />
                                    </div>
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingId(q.id);
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(q.id);
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-gray-800 whitespace-pre-wrap">{q.text}</p>
                                        {q.imageUrl && (
                                            <div className="mt-2">
                                                <img src={q.imageUrl} alt="Question Image" className="max-h-48 rounded border border-gray-200" />
                                            </div>
                                        )}
                                        {q.type === "MULTIPLE_CHOICE" && q.options && (
                                            <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-1">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className={`text-sm ${String(i + 1) === q.correctAnswer ? "text-green-600 font-bold" : "text-gray-600"}`}>
                                                        {String(i + 1) === q.correctAnswer ? "✓ " : "・ "}{opt}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {q.type === "MATCHING" && (
                                            <div className="mt-3 text-sm text-gray-500 italic">
                                                (マッチング問題の設定済み)
                                            </div>
                                        )}
                                    </div>
                                )}
                            </SortableItem>
                        ))}
                    </SortableContext>
                </DndContext>
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
            {showImport && (
                <QuestionImportFromExam
                    onImport={handleImportQuestions}
                    onClose={() => setShowImport(false)}
                />
            )}
            {showSettings && exam && (
                <ExamSettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    onSave={handleSaveSettings}
                    initialData={{
                        title: exam.title,
                        description: exam.description || "",
                        timeLimit: exam.timeLimit,
                        passingScore: exam.passingScore,
                        isShuffle: exam.isShuffle,
                        className: exam.className,
                    }}
                />
            )}
        </div>
    );
}

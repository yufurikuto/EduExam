"use client";

import { useState, useEffect } from "react";
import { X, Check, Search, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { getExams, getExam } from "@/app/actions/exam";

type Props = {
    onImport: (questions: any[]) => void;
    onClose: () => void;
};

export default function QuestionImportFromExam({ onImport, onClose }: Props) {
    const [exams, setExams] = useState<any[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    const [questions, setQuestions] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    // Load available exams
    useEffect(() => {
        async function load() {
            const data = await getExams();
            setExams(data);
            setLoadingExams(false);
        }
        load();
    }, []);

    // Load questions when exam selected
    useEffect(() => {
        if (!selectedExamId) {
            setQuestions([]);
            return;
        }
        const currentId = selectedExamId;
        async function loadQ() {
            setLoadingQuestions(true);
            const data = await getExam(currentId);
            if (data && data.questions) {
                // Parse DB options (json) to UI options (array)
                const parsed = data.questions.map((q: any) => ({
                    ...q,
                    options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : [])
                }));
                // Exclude IDs to avoid collision? No, we will generate new IDs on import.
                setQuestions(parsed);
            }
            setLoadingQuestions(false);
            setSelectedQuestionIds(new Set()); // Reset selection
        }
        loadQ();
    }, [selectedExamId]);

    const toggleQuestion = (q: any) => {
        const newSet = new Set(selectedQuestionIds);
        if (newSet.has(q.id)) {
            newSet.delete(q.id);
        } else {
            newSet.add(q.id);
        }
        setSelectedQuestionIds(newSet);
    };

    const handleImport = () => {
        const toImport = questions.filter(q => selectedQuestionIds.has(q.id));
        // Clean up data for new import
        const cleaned = toImport.map(q => ({
            text: q.text,
            type: q.type,
            score: q.score,
            options: q.options,
            correctAnswer: q.correctAnswer,
            imageUrl: q.imageUrl
        }));
        onImport(cleaned);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center">
                        <BookOpen className="mr-2" size={20} />
                        過去の試験から問題をインポート
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar: Exam List */}
                    <div className="w-1/3 border-r bg-gray-50 flex flex-col">
                        <div className="p-3 border-b bg-white">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                試験を選択
                            </h4>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="検索..."
                                    className="w-full pl-8 pr-3 py-2 text-sm border rounded hover:border-gray-300 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loadingExams ? (
                                <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {exams.map(exam => (
                                        <li
                                            key={exam.id}
                                            onClick={() => setSelectedExamId(exam.id)}
                                            className={`p-3 cursor-pointer hover:bg-white transition-colors flex justify-between items-center ${selectedExamId === exam.id ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : ''}`}
                                        >
                                            <div className="overflow-hidden">
                                                <p className={`text-sm font-medium truncate ${selectedExamId === exam.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                                                    {exam.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                    {new Date(exam.updatedAt).toLocaleDateString()} 更新
                                                </p>
                                            </div>
                                            {selectedExamId === exam.id && <ChevronRight size={16} className="text-indigo-500 flex-shrink-0" />}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Main: Question List */}
                    <div className="flex-1 flex flex-col bg-white">
                        {!selectedExamId ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
                                <BookOpen size={48} className="mb-4 opacity-50" />
                                <p>左側から試験を選択してください</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="selectAll"
                                            checked={questions.length > 0 && selectedQuestionIds.size === questions.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedQuestionIds(new Set(questions.map(q => q.id)));
                                                } else {
                                                    setSelectedQuestionIds(new Set());
                                                }
                                            }}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                            すべて選択 ({questions.length}問)
                                        </label>
                                    </div>
                                    <span className="text-sm text-indigo-600 font-bold">
                                        {selectedQuestionIds.size}問 選択中
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {loadingQuestions ? (
                                        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400 h-8 w-8" /></div>
                                    ) : (
                                        questions.map((q, idx) => (
                                            <div
                                                key={q.id}
                                                onClick={() => toggleQuestion(q)}
                                                className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedQuestionIds.has(q.id) ? 'ring-2 ring-indigo-500 border-transparent bg-indigo-50' : 'hover:border-gray-300'}`}
                                            >
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0 pt-0.5 mr-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedQuestionIds.has(q.id)}
                                                            readOnly
                                                            className="h-5 w-5 text-indigo-600 bg-white border-gray-300 rounded"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-1">
                                                            <span className="text-xs font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded mr-2">
                                                                {q.type}
                                                            </span>
                                                            <span className="text-xs text-gray-500">{q.score}点</span>
                                                        </div>
                                                        <p className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-3">{q.text}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={selectedQuestionIds.size === 0}
                        className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={18} className="mr-2" />
                        インポート ({selectedQuestionIds.size}問)
                    </button>
                </div>
            </div>
        </div>
    );
}

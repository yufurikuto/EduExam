"use client";

import { useState } from "react";
import { Upload, HelpCircle, X, Check } from "lucide-react";

type Question = {
    id: string; // Temporary ID
    text: string;
    type: string;
    options: string[];
    correctAnswer: string;
    score: number;
};

type Props = {
    onImport: (questions: any[]) => void;
    onClose: () => void;
};

export default function QuestionImport({ onImport, onClose }: Props) {
    const [text, setText] = useState("");
    const [preview, setPreview] = useState<any[]>([]);
    const [scanned, setScanned] = useState(false);

    const parseQuestions = () => {
        const lines = text.split("\n").map(l => l.trim()).filter(l => l);
        const questions: any[] = [];

        let currentQ: any = null;

        // Simple parser
        // Assumes:
        // Question text...
        // 1. Option
        // 2. Option
        // *3. Correct Option

        lines.forEach(line => {
            // Check if it's an option (starts with a letter/number and dot/parenthesis, or *)
            const isOption = /^(?:\*)?(?:[A-D1-5][\.\)]|[-•])\s+/.test(line);
            const isCorrect = line.startsWith("*");
            const content = line.replace(/^[\*\-•A-D1-5\.\)]+\s+/, "").trim();

            if (isOption) {
                if (currentQ) {
                    currentQ.options.push(content);
                    if (isCorrect) {
                        // For multi-choice, we store the index (1-based) as string
                        currentQ.correctAnswer = String(currentQ.options.length);
                    }
                }
            } else {
                // Should be a new question text
                if (currentQ) {
                    questions.push(currentQ);
                }
                currentQ = {
                    id: crypto.randomUUID(),
                    text: line,
                    type: "MULTIPLE_CHOICE",
                    score: 10,
                    options: [],
                    correctAnswer: "",
                    imageUrl: null
                };
            }
        });

        if (currentQ) {
            questions.push(currentQ);
        }

        setPreview(questions);
        setScanned(true);
    };

    const handleConfirm = () => {
        onImport(preview);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center">
                        <Upload className="mr-2" size={20} />
                        問題を一括インポート
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 p-4 overflow-hidden flex flex-col">
                    {!scanned ? (
                        <>
                            <div className="bg-blue-50 p-4 rounded mb-4 text-sm text-blue-800">
                                <p className="font-bold flex items-center mb-1"><HelpCircle size={16} className="mr-1" /> 形式について</p>
                                <ul className="list-disc ml-4 space-y-1">
                                    <li>質問文の後に選択肢を書いてください。</li>
                                    <li>正解の選択肢の行頭に <code>*</code> を付けてください。</li>
                                    <li>空行を入れる必要はありません。</li>
                                </ul>
                                <pre className="bg-white p-2 mt-2 rounded border border-blue-100 text-xs">
                                    {`日本の首都はどこですか？
1. 大阪
*2. 東京
3. 京都
4. 名古屋

次のうち、赤い果物は？
*A. りんご
B. バナナ`}
                                </pre>
                            </div>
                            <textarea
                                className="flex-1 w-full p-4 border border-gray-300 rounded font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="ここにテキストを貼り付けてください..."
                                value={text}
                                onChange={e => setText(e.target.value)}
                            />
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            <h4 className="font-bold mb-2">{preview.length}件の問題を検出しました:</h4>
                            <div className="space-y-4">
                                {preview.map((q, idx) => (
                                    <div key={idx} className="border p-3 rounded bg-gray-50 text-sm">
                                        <div className="font-bold mb-2">Q{idx + 1}. {q.text}</div>
                                        <ul className="pl-4 space-y-1">
                                            {q.options.map((opt: string, i: number) => (
                                                <li key={i} className={String(i + 1) === q.correctAnswer ? "text-green-600 font-bold" : "text-gray-600"}>
                                                    {String(i + 1) === q.correctAnswer ? "✓ " : "• "}{opt}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                    {scanned ? (
                        <>
                            <button
                                onClick={() => setScanned(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded"
                            >
                                戻る
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                            >
                                <Check size={18} className="mr-1" />
                                インポート実行
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={parseQuestions}
                            disabled={!text.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                            解析する
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

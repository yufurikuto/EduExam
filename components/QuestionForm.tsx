"use client";

import { useState } from "react";
import { Save, X, Trash, PlusCircle, ImageIcon, Type } from "lucide-react";
import ImageUploader from "./ImageUploader";

type QuestionType = "MULTIPLE_CHOICE" | "TEXT" | "TRUE_FALSE" | "MATCHING" | "ORDERING" | "FILL_IN_THE_BLANK";

type Question = {
    id: string;
    text: string;
    imageUrl?: string; // 問題文の画像
    type: QuestionType;
    score: number;
    options?: string[]; // 選択肢 (JSON string or array)
    correctAnswer?: string; // FILL_IN_THE_BLANK では使用しない（text内に埋め込み）
};

interface QuestionFormProps {
    question?: Question;
    onSave: (q: Question) => void;
    onCancel: () => void;
}

export default function QuestionForm({
    question,
    onSave,
    onCancel,
}: QuestionFormProps) {
    const [text, setText] = useState(question?.text || "");
    const [imageUrl, setImageUrl] = useState(question?.imageUrl || "");
    const [type, setType] = useState<QuestionType>(question?.type || "MULTIPLE_CHOICE");
    const [score, setScore] = useState(question?.score || 10);

    // Option type state: "text" or "image"
    const [optionType, setOptionType] = useState<"text" | "image">("text"); // For MC/Ordering
    const [leftOptionType, setLeftOptionType] = useState<"text" | "image">("text"); // For Matching Left
    const [rightOptionType, setRightOptionType] = useState<"text" | "image">("text"); // For Matching Right

    // 選択式の場合のオプション管理
    const [options, setOptions] = useState<string[]>(
        question?.options || ["", "", "", ""]
    );
    const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || "");

    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...options];
        newOpts[idx] = val;
        setOptions(newOpts);
    };

    const addOption = () => setOptions([...options, ""]);
    const removeOption = (idx: number) => {
        const newOpts = options.filter((_, i) => i !== idx);
        setOptions(newOpts);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: question?.id || "",
            text,
            imageUrl,
            type,
            score,
            options: type === "MULTIPLE_CHOICE" || type === "ORDERING" || type === "MATCHING" ? options : undefined,
            correctAnswer,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-indigo-100">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">問題文</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        required
                        placeholder="問題文を入力してください"
                    />
                    <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">参考画像 (任意)</label>
                        <ImageUploader
                            onImageSelected={setImageUrl}
                            initialImage={imageUrl}
                            className="w-full max-w-xs"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">形式</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as QuestionType)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded"
                        >
                            <option value="MULTIPLE_CHOICE">選択式</option>
                            <option value="TEXT">記述式</option>
                            <option value="TRUE_FALSE">○×問題</option>
                            <option value="ORDERING">並び替え</option>
                            <option value="MATCHING">線引き(マッチング)</option>
                            <option value="FILL_IN_THE_BLANK">穴埋め</option>
                        </select>
                    </div>
                    <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700">配点</label>
                        <input
                            type="number"
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            className="mt-1 w-full p-2 border border-gray-300 rounded"
                            min={1}
                        />
                    </div>
                </div>

                {/* 形式ごとの入力エリア */}
                {/* 形式ごとの入力エリア */}
                {(type === "MULTIPLE_CHOICE" || type === "ORDERING") && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700">
                                {type === "ORDERING" ? "並べ替えの正解順序 (上から順)" : "選択肢"}
                            </label>

                            <div className="flex items-center gap-2">
                                {type === "MULTIPLE_CHOICE" && (
                                    <label className="flex items-center text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded cursor-pointer border border-indigo-100 hover:bg-indigo-100 transition">
                                        <input
                                            type="checkbox"
                                            className="mr-1 rounded text-indigo-600 focus:ring-indigo-500"
                                            checked={correctAnswer.startsWith("[")}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    // Switch to multiple (checkbox)
                                                    // Convert current answer to array if exists
                                                    setCorrectAnswer(correctAnswer ? JSON.stringify([correctAnswer]) : "[]");
                                                } else {
                                                    // Switch to single (radio)
                                                    // Take first answer or empty
                                                    try {
                                                        const parsed = JSON.parse(correctAnswer);
                                                        setCorrectAnswer(parsed[0] || "");
                                                    } catch {
                                                        setCorrectAnswer("");
                                                    }
                                                }
                                            }}
                                        />
                                        複数選択を許可
                                    </label>
                                )}

                                {(type === "ORDERING" || type === "MULTIPLE_CHOICE") && (
                                    <div className="flex bg-gray-200 rounded p-1 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setOptionType("text")}
                                            className={`px-2 py-1 rounded flex items-center ${optionType === "text" ? "bg-white shadow" : "text-gray-500 hover:text-gray-900"}`}
                                        >
                                            <Type size={12} className="mr-1" /> 文字
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOptionType("image")}
                                            className={`px-2 py-1 rounded flex items-center ${optionType === "image" ? "bg-white shadow" : "text-gray-500 hover:text-gray-900"}`}
                                        >
                                            <ImageIcon size={12} className="mr-1" /> 画像
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {options.map((opt, idx) => {
                            const isMultiple = correctAnswer.startsWith("[");
                            const currentIdxStr = String(idx + 1);
                            let isChecked = false;

                            if (isMultiple) {
                                try {
                                    const parsed = JSON.parse(correctAnswer);
                                    isChecked = Array.isArray(parsed) && parsed.includes(currentIdxStr);
                                } catch { }
                            } else {
                                isChecked = correctAnswer === currentIdxStr;
                            }

                            return (
                                <div key={idx} className="flex items-center gap-2 border-b pb-2 last:border-0">
                                    {type === "MULTIPLE_CHOICE" && (
                                        <input
                                            type={isMultiple ? "checkbox" : "radio"}
                                            name="correct"
                                            checked={isChecked}
                                            onChange={() => {
                                                if (isMultiple) {
                                                    try {
                                                        let parsed = JSON.parse(correctAnswer);
                                                        if (!Array.isArray(parsed)) parsed = [];
                                                        if (parsed.includes(currentIdxStr)) {
                                                            parsed = parsed.filter((v: string) => v !== currentIdxStr);
                                                        } else {
                                                            parsed.push(currentIdxStr);
                                                        }
                                                        setCorrectAnswer(JSON.stringify(parsed.sort()));
                                                    } catch {
                                                        setCorrectAnswer(JSON.stringify([currentIdxStr]));
                                                    }
                                                } else {
                                                    setCorrectAnswer(currentIdxStr);
                                                }
                                            }}
                                            className={`w-4 h-4 text-indigo-600 mt-2 ${isMultiple ? "rounded" : ""}`}
                                        />
                                    )}
                                    {type === "ORDERING" && (
                                        <span className="text-gray-400 font-mono w-6 text-center mt-2">{idx + 1}</span>
                                    )}

                                    <div className="flex-1">
                                        {optionType === "text" ? (
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                                placeholder={`選択肢 ${idx + 1}`}
                                            />
                                        ) : (
                                            <div className="mt-1">
                                                <ImageUploader
                                                    onImageSelected={(val) => handleOptionChange(idx, val)}
                                                    initialImage={opt.startsWith("data:") || opt.startsWith("http") ? opt : undefined}
                                                    className="w-32"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeOption(idx)}
                                        className="text-gray-400 hover:text-red-500 mt-2"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            )
                        })}
                        <button
                            type="button"
                            onClick={addOption}
                            className="mt-2 text-sm text-indigo-600 flex items-center hover:text-indigo-800"
                        >
                            <PlusCircle size={16} className="mr-1" /> 追加
                        </button>
                        {type === "ORDERING" && (
                            <p className="text-xs text-gray-500 mt-1">
                                ※ 画像を使用する場合はURLを入力してください。受験者にはシャッフルされて表示されます。
                            </p>
                        )}
                    </div>
                )}

                {type === "MATCHING" && (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-700">左側</label>
                                    <div className="flex bg-gray-200 rounded p-1 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setLeftOptionType("text")}
                                            className={`px-2 py-1 rounded flex items-center ${leftOptionType === "text" ? "bg-white shadow" : "text-gray-500 hover:text-gray-900"}`}
                                        >
                                            <Type size={12} className="mr-1" /> 文字
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLeftOptionType("image")}
                                            className={`px-2 py-1 rounded flex items-center ${leftOptionType === "image" ? "bg-white shadow" : "text-gray-500 hover:text-gray-900"}`}
                                        >
                                            <ImageIcon size={12} className="mr-1" /> 画像
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="w-8 flex items-center justify-center">
                                <span className="text-gray-400">↔</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-700">右側</label>
                                    <div className="flex bg-gray-200 rounded p-1 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setRightOptionType("text")}
                                            className={`px-2 py-1 rounded flex items-center ${rightOptionType === "text" ? "bg-white shadow" : "text-gray-500 hover:text-gray-900"}`}
                                        >
                                            <Type size={12} className="mr-1" /> 文字
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRightOptionType("image")}
                                            className={`px-2 py-1 rounded flex items-center ${rightOptionType === "image" ? "bg-white shadow" : "text-gray-500 hover:text-gray-900"}`}
                                        >
                                            <ImageIcon size={12} className="mr-1" /> 画像
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">左右の正しい組み合わせを入力してください。</p>
                        <div className="space-y-3">
                            {options.map((opt, idx) => {
                                // JSON Parse
                                let left = "", right = "";
                                try {
                                    const parsed = JSON.parse(opt);
                                    left = parsed.left || "";
                                    right = parsed.right || "";
                                } catch {
                                    left = opt;
                                }

                                return (
                                    <div key={idx} className="flex items-start gap-4 p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
                                        <div className="flex items-center h-full pt-2">
                                            <span className="text-gray-400 text-xs font-mono">{idx + 1}</span>
                                        </div>

                                        <div className="flex-1">
                                            {leftOptionType === "text" ? (
                                                <input
                                                    type="text"
                                                    value={left}
                                                    onChange={(e) => {
                                                        const newVal = JSON.stringify({ left: e.target.value, right });
                                                        handleOptionChange(idx, newVal);
                                                    }}
                                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                                    placeholder="左側のテキスト"
                                                />
                                            ) : (
                                                <ImageUploader
                                                    onImageSelected={(val) => {
                                                        const newVal = JSON.stringify({ left: val, right });
                                                        handleOptionChange(idx, newVal);
                                                    }}
                                                    initialImage={left.startsWith("data:") || left.startsWith("http") ? left : undefined}
                                                    className="w-full"
                                                />
                                            )}
                                        </div>

                                        <div className="flex items-center h-full pt-2">
                                            <span className="text-gray-300">↔</span>
                                        </div>

                                        <div className="flex-1">
                                            {rightOptionType === "text" ? (
                                                <input
                                                    type="text"
                                                    value={right}
                                                    onChange={(e) => {
                                                        const newVal = JSON.stringify({ left, right: e.target.value });
                                                        handleOptionChange(idx, newVal);
                                                    }}
                                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                                    placeholder="右側のテキスト"
                                                />
                                            ) : (
                                                <ImageUploader
                                                    onImageSelected={(val) => {
                                                        const newVal = JSON.stringify({ left, right: val });
                                                        handleOptionChange(idx, newVal);
                                                    }}
                                                    initialImage={right.startsWith("data:") || right.startsWith("http") ? right : undefined}
                                                    className="w-full"
                                                />
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeOption(idx)}
                                            className="text-gray-400 hover:text-red-500 pt-2"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                // 新しいペア追加（JSON形式で初期化）
                                setOptions([...options, JSON.stringify({ left: "", right: "" })]);
                            }}
                            className="mt-2 text-sm text-indigo-600 flex items-center hover:text-indigo-800"
                        >
                            <PlusCircle size={16} className="mr-1" /> ペアを追加
                        </button>
                    </div>
                )}

                {type === "TRUE_FALSE" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">正解</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="tf"
                                    value="true"
                                    checked={correctAnswer === "true"}
                                    onChange={() => setCorrectAnswer("true")}
                                />
                                ○ (True)
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="tf"
                                    value="false"
                                    checked={correctAnswer === "false"}
                                    onChange={() => setCorrectAnswer("false")}
                                />
                                × (False)
                            </label>
                        </div>
                    </div>
                )}

                {type === "TEXT" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">模範解答 (任意)</label>
                        <textarea
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            rows={2}
                        />
                    </div>
                )}

                {type === "FILL_IN_THE_BLANK" && (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm border border-blue-200">
                        <strong>ヒント:</strong> 空欄にしたい部分を <code>{"{ }"}</code> で囲んでください。<br />
                        例: <code>日本の首都は {"{東京}"} です。</code> → 日本の首都は [ 東京 ] です。
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                    キャンセル
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 flex items-center"
                >
                    <Save size={16} className="mr-1" /> 保存
                </button>
            </div>
        </form>
    );
}

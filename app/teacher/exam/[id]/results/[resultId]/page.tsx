'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getExamResultById, updateAnswerScore } from '@/app/actions/exam';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function ExamResultDetailPage({ params }: { params: { id: string; resultId: string } }) {
    const router = useRouter();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editingDetail, setEditingDetail] = useState<any>(null);
    const [editScore, setEditScore] = useState(0);
    const [editComment, setEditComment] = useState("");
    const [editIsCorrect, setEditIsCorrect] = useState(false);

    useEffect(() => {
        loadData();
    }, [params.resultId]);

    async function loadData() {
        setLoading(true);
        const data = await getExamResultById(params.resultId);
        setResult(data);
        setLoading(false);
    }

    const openEditModal = (detail: any) => {
        setEditingDetail(detail);
        setEditScore(detail.score);
        setEditComment(detail.teacherComment || "");
        setEditIsCorrect(detail.isCorrect);
    };

    const handleSave = async () => {
        if (!editingDetail) return;

        const res = await updateAnswerScore(
            result.id,
            editingDetail.id,
            editScore,
            editComment,
            editIsCorrect
        );

        if (res.success) {
            setEditingDetail(null);
            loadData(); // Reload to see changes
        } else {
            alert("更新に失敗しました: " + res.error);
        }
    };

    const formatCorrectAnswer = (q: any) => {
        if (!q) return "不明";

        try {
            if (q.type === "MULTIPLE_CHOICE") {
                let indices: string[] = [];
                // Try JSON parse first (for multi-select)
                try {
                    const parsed = JSON.parse(q.correctAnswer);
                    if (Array.isArray(parsed)) indices = parsed;
                    else indices = [String(parsed)];
                } catch {
                    // Single string
                    indices = [q.correctAnswer];
                }

                // Map indices to option text
                // Options can be string or JSON string array
                let options: string[] = [];
                if (Array.isArray(q.options)) options = q.options;
                else if (typeof q.options === 'string') {
                    try { options = JSON.parse(q.options); } catch { }
                }

                return indices.map(i => {
                    const idx = parseInt(i) - 1;
                    return options[idx] || `選択肢${i}`;
                }).join(", ");
            }

            if (q.type === "TRUE_FALSE") {
                return q.correctAnswer === "true" ? "○ (True)" : "× (False)";
            }

            if (q.type === "ORDERING") {
                // For Ordering, the 'options' field stored in DB IS the correct order
                let options: string[] = [];
                if (Array.isArray(q.options)) options = q.options;
                else if (typeof q.options === 'string') {
                    try { options = JSON.parse(q.options); } catch { }
                }
                return options.map((opt, i) => `${i + 1}. ${opt}`).join("\n");
            }

            if (q.type === "MATCHING") {
                // Options contains [{left: "A", right: "B"}] or similar
                let pairs: any[] = [];
                if (Array.isArray(q.options)) pairs = q.options;
                else if (typeof q.options === 'string') {
                    try { pairs = JSON.parse(q.options); } catch { }
                }

                return pairs.map((p: any) => {
                    let left = p.left, right = p.right;
                    // Handle JSON strings in pairs if double-serialized
                    try {
                        if (typeof p === 'string') {
                            const parsed = JSON.parse(p);
                            left = parsed.left;
                            right = parsed.right;
                        }
                    } catch { }
                    return `${left} ↔ ${right}`;
                }).join("\n");
            }

            if (q.type === "FILL_IN_THE_BLANK") {
                // Extract from text: {answer}
                // Normalize brackets first
                const normalizedText = q.text.replace(/｛/g, '{').replace(/｝/g, '}');
                const matches = normalizedText.match(/{([^}]+)}/g);
                if (matches) {
                    return matches.map((m: string) => m.slice(1, -1).trim()).join(", ");
                }
            }

            return q.correctAnswer || "(登録なし)";
        } catch (e) {
            return "表示エラー";
        }
    };

    if (loading) return <div className="p-8 text-center">読み込み中...</div>;
    if (!result) return <div className="p-8 text-center text-red-500">データが見つかりません。</div>;

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-8">
            <div className="mb-6 flex items-center">
                <Link href={`/teacher/exam/${params.id}/results`} className="text-indigo-600 hover:text-indigo-800 flex items-center mr-4">
                    <ChevronLeft className="w-5 h-5" />
                    戻る
                </Link>
                <h1 className="text-2xl font-bold">受験結果詳細</h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">氏名</p>
                        <p className="text-lg font-medium">{result.studentName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">番号</p>
                        <p className="text-lg font-medium">{result.studentNumber}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">スコア</p>
                        <p className="text-2xl font-bold text-indigo-600">{result.score} 点</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {result.answerDetails?.map((detail: any, index: number) => (
                    <div key={detail.id} className={`bg-white shadow rounded-lg p-6 border-l-4 ${detail.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">問{index + 1}</h3>
                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${detail.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {detail.isCorrect ? '正解' : '不正解'}
                                </span>
                                <span className="text-sm text-gray-500 w-24 text-right">
                                    獲得点: {detail.score}
                                </span>
                                <button
                                    onClick={() => openEditModal(detail)}
                                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition"
                                >
                                    採点修正
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">問題文</p>
                            <p className="text-md text-gray-900">{detail.question.text}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-500 uppercase">生徒の回答</p>
                                <p className="font-mono text-sm mt-1 whitespace-pre-wrap">{detail.answer || "(未回答)"}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded">
                                <p className="text-xs text-blue-500 uppercase">正解</p>
                                <p className="font-mono text-sm mt-1 whitespace-pre-wrap">{formatCorrectAnswer(detail.question)}</p>
                            </div>
                        </div>

                        {detail.teacherComment && (
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                <p className="text-xs text-yellow-700 font-bold mb-1">先生からのコメント</p>
                                <p className="text-sm text-yellow-900">{detail.teacherComment}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">採点の手動修正</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">正誤ステータス</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={editIsCorrect}
                                        onChange={() => setEditIsCorrect(true)}
                                        className="mr-2"
                                    />
                                    <span className="text-green-600 font-bold">正解として扱う</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={!editIsCorrect}
                                        onChange={() => setEditIsCorrect(false)}
                                        className="mr-2"
                                    />
                                    <span className="text-red-600 font-bold">不正解として扱う</span>
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">スコア (点数)</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded p-2"
                                value={editScore}
                                onChange={(e) => setEditScore(Number(e.target.value))}
                            />
                            <p className="text-xs text-gray-500 mt-1">※ 配点: {editingDetail.question.score}点</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">コメント</label>
                            <textarea
                                className="w-full border border-gray-300 rounded p-2"
                                rows={3}
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                placeholder="採点理由やフィードバック..."
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setEditingDetail(null)}
                                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

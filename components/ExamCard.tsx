"use client";

import Link from "next/link";
import { Edit, Eye, Copy, QrCode, Clock, BookOpen, Check } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";

type ExamCardProps = {
    exam: any; // Type should be properly defined in a shared type file
};

export default function ExamCard({ exam }: ExamCardProps) {
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);

    const examUrl = typeof window !== "undefined"
        ? `${window.location.origin}/student/exam/${exam.id}`
        : `/student/exam/${exam.id}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(examUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
            // Fallback
            prompt("コピーしてください:", examUrl);
        }
    };

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg flex flex-col hover:shadow-md transition">
            <div className="px-4 py-5 sm:p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                    <span
                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                        style={{ backgroundColor: exam.subject?.color || '#e0f2fe' }}
                    >
                        {exam.subject?.name || '未分類'}
                    </span>
                    <span className="text-xs text-gray-500">
                        {new Date(exam.updatedAt).toLocaleDateString()}
                    </span>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2 truncate">
                    {exam.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                    {exam.description || '説明なし'}
                </p>

                <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                        <BookOpen className="mr-1.5 h-4 w-4" />
                        {exam._count?.questions || 0}問
                    </div>
                    <div className="flex items-center">
                        <Clock className="mr-1.5 h-4 w-4" />
                        {exam.timeLimit ? `${exam.timeLimit}分` : '無制限'}
                    </div>

                    <Link href={`/teacher/exam/${exam.id}/results`} className="flex items-center text-indigo-600 hover:text-indigo-800">
                        <span className="text-xs border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded">結果を見る</span>
                    </Link>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <Link
                        href={`/teacher/exam/${exam.id}/edit`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
                    >
                        <Edit className="mr-1 h-4 w-4" />
                        編集
                    </Link>
                    <Link
                        href={`/student/exam/${exam.id}?mode=preview`}
                        target="_blank"
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center"
                    >
                        <Eye className="mr-1 h-4 w-4" />
                        プレビュー
                    </Link>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className={`flex-1 flex items-center justify-center px-3 py-1.5 border text-xs font-medium rounded shadow-sm transition-colors ${copied
                            ? "border-green-500 text-green-700 bg-green-50"
                            : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                            }`}
                    >
                        {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                        {copied ? "コピー済" : "URLコピー"}
                    </button>
                    <button
                        onClick={() => setShowQr(true)}
                        className="flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <QrCode className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* QR Modal */}
            {showQr && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">受験用QRコード</h3>
                        <div className="flex justify-center mb-4 bg-white p-2">
                            <QRCode value={examUrl} size={200} />
                        </div>
                        <p className="text-xs text-gray-500 mb-4 break-all bg-gray-100 p-2 rounded">
                            {examUrl}
                        </p>
                        <button
                            onClick={() => setShowQr(false)}
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

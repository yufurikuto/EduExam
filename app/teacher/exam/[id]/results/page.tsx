import { getExam, getExamResults } from "@/app/actions/exam";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ExamResultsPage({ params }: { params: { id: string } }) {
    const exam = await getExam(params.id);
    const results = await getExamResults(params.id);

    if (!exam) {
        return <div className="p-8">試験が見つかりません</div>;
    }

    // CSV Download (Client Component approach or simple API link would be better, but here strictly server rendered list)
    // For now just the list

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/teacher/dashboard" className="text-gray-500 hover:text-gray-700 flex items-center mb-2">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            ダッシュボードに戻る
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">{exam.title} - 受験結果</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            合計 {results.length} 件の回答
                        </p>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    出席番号
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    名前
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    スコア
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    提出日時
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">詳細</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        まだ回答がありません
                                    </td>
                                </tr>
                            ) : (
                                results.map((result) => (
                                    <tr key={result.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {result.studentNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {result.studentName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                            {result.score} 点
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(result.submittedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Detail view can be implemented later */}
                                            {/* <span className="text-indigo-600 hover:text-indigo-900 cursor-pointer">詳細</span> */}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

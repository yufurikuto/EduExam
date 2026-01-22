'use client';

import { useState, useEffect } from 'react';
import { getExamAnalysis, getExamResults } from '@/app/actions/exam'; // Need getExamResults for CSV
import Link from 'next/link';
import { ChevronLeft, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalysisPage({ params }: { params: { id: string } }) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [params.id]);

    async function loadData() {
        setLoading(true);
        const data = await getExamAnalysis(params.id);
        setAnalysis(data);
        setLoading(false);
    }

    const downloadCSV = async () => {
        // Fetch full results for export
        const results = await getExamResults(params.id, { sortBy: 'studentNumber' });

        // Define headers
        const headers = ['氏名', '番号', 'クラス', 'スコア', '提出日時'];

        // Generate CSV content
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM
        csvContent += headers.join(",") + "\n";

        results.forEach((r: any) => {
            const row = [
                `"${r.studentName}"`,
                `"${r.studentNumber}"`,
                `"${r.studentClass || ''}"`,
                r.score,
                `"${new Date(r.submittedAt).toLocaleString()}"`
            ];
            csvContent += row.join(",") + "\n";
        });

        // Trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `exam_results_${params.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">データを分析中...</div>;
    if (!analysis) return <div className="p-8 text-center text-red-500">データが見つかりません。</div>;

    const { stats, distribution, questionStats } = analysis;

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <div className="flex items-center mb-4 sm:mb-0">
                    <Link href={`/teacher/exam/${params.id}/results`} className="text-indigo-600 hover:text-indigo-800 flex items-center mr-4">
                        <ChevronLeft className="w-5 h-5" />
                        結果一覧へ
                    </Link>
                    <h1 className="text-2xl font-bold">試験分析ダッシュボード</h1>
                </div>
                <button
                    onClick={downloadCSV}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition shadow-sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    CSVダウンロード
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
                    <p className="text-sm text-gray-500">受験者数</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.count} <span className="text-sm font-normal">人</span></p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500">平均点</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.average}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <p className="text-sm text-gray-500">最高点</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.max}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <p className="text-sm text-gray-500">最低点</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.min}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Score Distribution Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">得点分布</h3>
                    <div className="h-64 cursor-default">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#f3f4f6' }}
                                />
                                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Weak/Strong Points Analysis (Conceptual or simple text) */}
                <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-center items-center">
                    <p className="text-gray-500 text-center mb-4">
                        問題別の正答率を以下で確認し、<br />
                        理解度の低い分野を特定しましょう。
                    </p>
                    {/* Could add actionable insights here later */}
                </div>
            </div>

            {/* Question Stats Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">問題別正答率</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">問題文 (抜粋)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">正解数</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">正答率</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {questionStats.map((q: any, index: number) => {
                                // Color coding for percentage
                                let percentageColor = "text-gray-900";
                                if (q.percentage >= 80) percentageColor = "text-green-600 font-bold";
                                else if (q.percentage < 40) percentageColor = "text-red-600 font-bold";

                                return (
                                    <tr key={q.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Q{index + 1}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                                            {q.text}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {q.correctCount} / {q.totalCount}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${percentageColor}`}>
                                            {q.percentage}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

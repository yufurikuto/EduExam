import { getExam, getExamResults } from "@/app/actions/exam";
import Link from "next/link";
import { ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import ResultsSearch from "@/components/ResultsSearch";

export const dynamic = 'force-dynamic';

export default async function ExamResultsPage({
    params,
    searchParams,
}: {
    params: { id: string };
    searchParams: {
        query?: string;
        sortBy?: "score" | "submittedAt" | "studentNumber" | "studentClass";
        sortOrder?: "asc" | "desc";
    };
}) {
    const exam = await getExam(params.id);
    const sortBy = searchParams.sortBy || "submittedAt";
    const sortOrder = searchParams.sortOrder || "desc";
    const currentPageParams = new URLSearchParams();
    if (searchParams.query) currentPageParams.set("query", searchParams.query);

    const results = await getExamResults(params.id, {
        sortBy,
        sortOrder,
        query: searchParams.query,
    });

    if (!exam) {
        return <div className="p-8">試験が見つかりません</div>;
    }

    // Helper to create sort link
    const SortHeader = ({
        field,
        label,
    }: {
        field: "score" | "submittedAt" | "studentNumber" | "studentClass";
        label: string;
    }) => {
        const isCurrent = sortBy === field;
        const nextOrder = isCurrent && sortOrder === "desc" ? "asc" : "desc";
        const urlParams = new URLSearchParams(currentPageParams);
        urlParams.set("sortBy", field);
        urlParams.set("sortOrder", nextOrder);

        return (
            <Link href={`?${urlParams.toString()}`} className="group flex items-center">
                {label}
                <span className="ml-2 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                    {isCurrent ? (
                        sortOrder === "desc" ? (
                            <ArrowDown className="h-4 w-4" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )
                    ) : (
                        <ArrowDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                    )}
                </span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link href="/teacher/dashboard" className="text-gray-500 hover:text-gray-700 flex items-center mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        ダッシュボードに戻る
                    </Link>
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-gray-900 leading-7 sm:truncate">
                                {exam.title} <span className="text-gray-500 font-normal text-lg ml-2">受験結果</span>
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                合計 {results.length} 件の回答
                            </p>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <ResultsSearch />
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <SortHeader field="studentClass" label="クラス" />
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <SortHeader field="studentNumber" label="出席番号" />
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        名前
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <SortHeader field="score" label="スコア" />
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <SortHeader field="submittedAt" label="提出日時" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                            {searchParams.query ? "検索条件に一致する回答がありません" : "まだ回答がありません"}
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((result) => (
                                        <tr key={result.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {result.studentClass}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {result.studentNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {result.studentName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.score >= (exam.passingScore || 60) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                    {result.score} 点
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(result.submittedAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

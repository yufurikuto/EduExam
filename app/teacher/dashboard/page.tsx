import Link from "next/link";
import { Plus, Clock, BookOpen, Edit, Play } from "lucide-react";
import { getExams } from "@/app/actions/exam";

export const dynamic = 'force-dynamic';

export default async function TeacherDashboard() {
    const exams = await getExams();

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between px-4 sm:px-0 mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            ダッシュボード
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href="/teacher/exam/create"
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            新しい試験を作成
                        </Link>
                    </div>
                </div>

                {/* Exam Grid */}
                {exams.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow border border-dashed border-gray-300">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">試験がありません</h3>
                        <p className="mt-1 text-sm text-gray-500">新しい試験を作成して始めましょう。</p>
                        <div className="mt-6">
                            <Link
                                href="/teacher/exam/create"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <Plus className="-ml-1 mr-2 h-5 w-5" />
                                新しい試験を作成
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0">
                        {(exams as any[]).map((exam) => (
                            <div key={exam.id} className="bg-white overflow-hidden shadow rounded-lg flex flex-col hover:shadow-md transition">
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
                                            {(exam as any)._count?.questions || 0}問
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="mr-1.5 h-4 w-4" />
                                            {exam.timeLimit ? `${exam.timeLimit}分` : '無制限'}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center border-t border-gray-200">
                                    <Link
                                        href={`/teacher/exam/${exam.id}/edit`}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
                                    >
                                        <Edit className="mr-1 h-4 w-4" />
                                        編集
                                    </Link>
                                    <Link
                                        href={`/student/exam/${exam.id}`}
                                        target="_blank"
                                        className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                                    >
                                        <Play className="mr-1 h-4 w-4" />
                                        受験用URL
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

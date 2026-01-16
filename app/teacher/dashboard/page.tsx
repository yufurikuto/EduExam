import Link from "next/link";
import { Plus, Clock, BookOpen, Edit, Play } from "lucide-react";
import { getExams } from "@/app/actions/exam";
import { getSubjects } from "@/app/actions/subject";
import ExamCard from "@/components/ExamCard";
import SubjectFilter from "@/components/SubjectFilter";

export const dynamic = 'force-dynamic';

export default async function TeacherDashboard({
    searchParams,
}: {
    searchParams: { subjectId?: string };
}) {
    const subjects = await getSubjects();
    const exams = await getExams(searchParams.subjectId);

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between px-4 sm:px-0 mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate mb-2 md:mb-0">
                            ダッシュボード
                        </h2>
                    </div>
                    <div className="mt-4 flex flex-col md:flex-row md:items-center md:mt-0 md:ml-4 space-y-2 md:space-y-0 md:space-x-4">
                        <SubjectFilter subjects={subjects} />
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
                        <h3 className="mt-2 text-sm font-medium text-gray-900">表示できる試験がありません</h3>
                        <p className="mt-1 text-sm text-gray-500">条件を変更するか、新しい試験を作成してください。</p>
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
                            <ExamCard key={exam.id} exam={exam} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Subject = {
    id: string;
    name: string;
};

export default function SubjectFilter({ subjects }: { subjects: Subject[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSubject = searchParams.get("subjectId") || "all";

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const params = new URLSearchParams(searchParams);
        if (value === "all") {
            params.delete("subjectId");
        } else {
            params.set("subjectId", value);
        }
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center space-x-2">
            <label htmlFor="subject-filter" className="text-sm font-medium text-gray-700">
                科目で絞り込み:
            </label>
            <select
                id="subject-filter"
                value={currentSubject}
                onChange={handleChange}
                className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
                <option value="all">すべて</option>
                {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                        {subject.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

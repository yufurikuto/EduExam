"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Settings, X } from "lucide-react";
import { createSubject, deleteSubject, type Subject } from "@/app/actions/subject";

interface SubjectManagerProps {
    subjects: Subject[];
    onUpdate: () => void;
}

export default function SubjectManager({ subjects, onUpdate }: SubjectManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const dialogRef = useRef<HTMLDialogElement>(null);

    const openModal = () => {
        setIsOpen(true);
        // dialogRef.current?.showModal(); // Using simple state for now for better control
    };

    const closeModal = () => {
        setIsOpen(false);
        setNewSubjectName("");
        setError("");
        // dialogRef.current?.close();
    };

    const handleCreate = async () => {
        if (!newSubjectName.trim()) return;
        setLoading(true);
        setError("");

        // Generate a random pastel color
        const hue = Math.floor(Math.random() * 360);
        const color = `hsl(${hue}, 70%, 80%)`;

        const result = await createSubject(newSubjectName, color);
        if (result.success) {
            setNewSubjectName("");
            onUpdate();
        } else {
            setError(result.error || "Failed");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("本当に削除しますか？")) return;
        setLoading(true);
        const result = await deleteSubject(id);
        if (result.success) {
            onUpdate();
        } else {
            alert(result.error);
        }
        setLoading(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
                <Settings className="h-4 w-4 mr-1" />
                編集
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-xl font-bold mb-4 text-gray-900">科目設定</h2>

                        {/* List */}
                        <div className="mb-6 max-h-60 overflow-y-auto space-y-2 border-b pb-4">
                            {subjects.length === 0 ? (
                                <p className="text-gray-500 text-sm">科目がありません</p>
                            ) : (
                                subjects.map((sub) => (
                                    <div key={sub.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: sub.color || '#ddd' }}
                                            />
                                            <span className="font-medium">{sub.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            disabled={loading}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add New */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">新しい科目を追加</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    placeholder="科目名 (例: 化学)"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
                                />
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={loading || !newSubjectName.trim()}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type ExamSettings = {
    title: string;
    description?: string;
    timeLimit?: number;
    passingScore?: number;
    isShuffle?: boolean;
    className?: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ExamSettings) => Promise<void>;
    initialData: ExamSettings;
};

export default function ExamSettingsModal({ isOpen, onClose, onSave, initialData }: Props) {
    const [formData, setFormData] = useState<ExamSettings>(initialData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert("保存に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    試験設定の編集
                                </h3>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">試験タイトル</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">対象クラス (任意)</label>
                                    <input
                                        type="text"
                                        value={formData.className || ""}
                                        onChange={(e) => setFormData({ ...formData, className: e.target.value || undefined })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="例: 1年A組"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">制限時間 (分)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.timeLimit || ""}
                                            onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) || undefined })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">合格点</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.passingScore || ""}
                                            onChange={(e) => setFormData({ ...formData, passingScore: Number(e.target.value) || undefined })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="modal-isShuffle"
                                        type="checkbox"
                                        checked={formData.isShuffle || false}
                                        onChange={(e) => setFormData({ ...formData, isShuffle: e.target.checked })}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="modal-isShuffle" className="ml-2 block text-sm text-gray-900">
                                        問題の順序をシャッフルする
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">説明文</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
                            >
                                {loading ? "保存中..." : "変更を保存"}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                キャンセル
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

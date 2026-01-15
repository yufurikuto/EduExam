"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploaderProps {
    onImageSelected: (base64: string) => void;
    initialImage?: string;
    className?: string; // Additional styling
}

export default function ImageUploader({
    onImageSelected,
    initialImage,
    className = "",
}: ImageUploaderProps) {
    const [preview, setPreview] = useState<string | null>(initialImage || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setPreview(base64);
                onImageSelected(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClear = () => {
        setPreview(null);
        onImageSelected("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`relative ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {preview ? (
                <div className="relative group inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={preview}
                        alt="Uploaded preview"
                        className="max-w-full h-auto max-h-48 rounded border border-gray-300 object-contain bg-white"
                    />
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={triggerSelect}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition p-4 text-gray-400 hover:text-indigo-500 hover:border-indigo-400"
                >
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs">クリックして画像を選択</span>
                </button>
            )}
        </div>
    );
}

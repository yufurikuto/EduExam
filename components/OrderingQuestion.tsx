"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";

interface OrderingQuestionProps {
    questionId: string;
    options: string[]; // 選択肢
    onAnswerChange: (answer: string) => void; // 順序をカンマ区切りなどで返す
}

export default function OrderingQuestion({
    questionId,
    options,
    onAnswerChange,
}: OrderingQuestionProps) {
    // 内部状態として現在の順序を保持
    // 初期状態は親から渡されたoptions（シャッフル済みであることを想定、あるいはここでシャッフルも可）
    const [items, setItems] = useState(options);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // 変更を親に通知 (例: "Apple,Orange,Banana")
                onAnswerChange(newItems.join(","));

                return newItems;
            });
        }
    }

    // 初期ロード時にも今の順序を回答としてセットしておく
    useEffect(() => {
        onAnswerChange(items.join(","));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items}
                strategy={verticalListSortingStrategy}
            >
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-500 mb-2">ドラッグして正しい順序に並び替えてください。</p>
                    {items.map((id) => (
                        <SortableItem key={id} id={id}>
                            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 cursor-grab hover:bg-indigo-50 active:cursor-grabbing flex items-center">
                                <span className="text-gray-400 mr-2">☰</span>
                                {id}
                            </div>
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

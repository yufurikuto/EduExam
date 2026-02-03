import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export function SortableItem({ id, children, onClick, className }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: "relative" as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={className}>
            <div className="flex items-start gap-2">
                <button
                    type="button"
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    className="mt-4 p-1 cursor-grab text-gray-400 hover:text-indigo-600 touch-none active:cursor-grabbing"
                    title="ドラッグして移動"
                >
                    <GripVertical size={20} />
                </button>
                <div 
                    onClick={onClick} 
                    className="flex-1 cursor-pointer w-full"
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

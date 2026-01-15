"use client";

import { useState, useRef, useEffect } from "react";

interface MatchingQuestionProps {
    questionId: string;
    pairs: { left: string; right: string }[];
    onAnswerChange?: (answer: string) => void;
}

export default function MatchingQuestion({
    questionId,
    pairs,
    onAnswerChange,
}: MatchingQuestionProps) {
    // 左側の項目IDと右側の項目IDのペア (例: { "0": "1", "1": "0" })
    // キーは左のインデックス、値は右のインデックス
    const [connections, setConnections] = useState<Record<string, string>>({});
    const [drawingStart, setDrawingStart] = useState<string | null>(null); // 左のインデックス
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    // 各項目の座標を保持するためのRef
    const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
    const rightRefs = useRef<(HTMLDivElement | null)[]>([]);

    // 左側の項目（固定）
    const leftItems = pairs.map((p) => p.left);
    // 右側の項目（シャッフルして表示するのが一般的だが、今回は簡単のためそのまま表示し、線をクロスさせる）
    // ※本来は右側をシャッフルすべきだが、pairsの順番で描画すると正解が並んだ状態になるため、親コンポーネントでシャッフルされたrightItemsを受け取るか、ここでシャッフルする必要がある。
    // ここでは「シャッフルされた選択肢」として扱うために、内部でインデックス管理を行いますが、
    // UI上は pairs の left と right を別々のリストとして表示します。
    const rightItems = pairs.map((p) => p.right);

    // 描画更新用のステート（座標再計算用）
    const [_, setTick] = useState(0);

    useEffect(() => {
        // リサイズ時などに線を再描画
        const handleResize = () => setTick((t) => t + 1);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getCoords = (el: HTMLDivElement | null, type: "left" | "right") => {
        if (!el || !containerRef.current) return { x: 0, y: 0 };
        const containerRect = containerRef.current.getBoundingClientRect();
        const itemRect = el.getBoundingClientRect();

        // 左側は右端、右側は左端を接続点とする
        const x = type === "left"
            ? itemRect.right - containerRect.left
            : itemRect.left - containerRect.left;
        const y = itemRect.top + itemRect.height / 2 - containerRect.top;

        return { x, y };
    };

    const handleMouseDownLeft = (index: number) => {
        // 既に接続されている場合は解除
        if (connections[String(index)]) {
            setConnections((prev) => {
                const next = { ...prev };
                delete next[String(index)];

                // update answer
                const answerStr = Object.entries(next)
                    .map(([l, r]) => `${l}:${r}`)
                    .join(",");
                onAnswerChange?.(answerStr);

                return next;
            });
            return;
        }
        setDrawingStart(String(index));
    };

    const handleMouseUpRight = (index: number) => {
        if (drawingStart !== null) {
            setConnections((prev) => {
                const next = { ...prev, [drawingStart]: String(index) };
                // 回答を親に通知 (形式: "leftIndex:rightIndex,..." )
                const answerStr = Object.entries(next)
                    .map(([l, r]) => `${l}:${r}`)
                    .join(",");
                onAnswerChange?.(answerStr);
                return next;
            });
            setDrawingStart(null);
            setMousePos(null);
        } else {
            // クリックで解除（右側の点）
            const connectedLeft = Object.keys(connections).find(key => connections[key] === String(index));
            if (connectedLeft) {
                setConnections((prev) => {
                    const next = { ...prev };
                    delete next[connectedLeft];

                    // update answer
                    const answerStr = Object.entries(next)
                        .map(([l, r]) => `${l}:${r}`)
                        .join(",");
                    onAnswerChange?.(answerStr);

                    return next;
                });
            }
        }
    };

    // キャンセル（コンテナないでマウスアップした場合など）
    const handleMouseUpContainer = () => {
        if (drawingStart !== null) {
            setDrawingStart(null);
            setMousePos(null);
        }
    };

    // ... (Container handlers remain same)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (drawingStart !== null && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    // 画像かどうか判定
    const isImage = (text: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(text) || text.startsWith("http");

    const renderContent = (content: string) => {
        if (isImage(content)) {
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={content} alt="content" className="h-16 w-auto object-contain border rounded" />;
        }
        return <span className="p-2 border rounded bg-white shadow-sm inline-block min-w-[100px] text-center">{content}</span>;
    };

    const isConnectedRight = (index: number) => Object.values(connections).includes(String(index));

    return (
        <div
            className="relative bg-gray-50 p-6 rounded-lg select-none"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpContainer}
            onMouseLeave={handleMouseUpContainer} // 枠外に出たらキャンセル
        >
            <p className="text-sm text-gray-500 mb-4 text-center">左の点から右の正しい項目へ線を引いてください。</p>

            <div className="flex justify-between items-center relative z-10">
                {/* Left Column */}
                <div className="flex flex-col space-y-8">
                    {leftItems.map((item, idx) => (
                        <div key={`left-${idx}`} className="flex items-center space-x-2">
                            <div className="content">
                                {renderContent(item)}
                            </div>
                            <div
                                ref={(el) => { leftRefs.current[idx] = el; }}
                                onMouseDown={() => handleMouseDownLeft(idx)}
                                className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-colors ${connections[String(idx)] ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-400 hover:border-indigo-500"
                                    }`}
                            ></div>
                        </div>
                    ))}
                </div>

                {/* Right Column */}
                <div className="flex flex-col space-y-8">
                    {rightItems.map((item, idx) => (
                        <div key={`right-${idx}`} className="flex items-center space-x-2">
                            <div
                                ref={(el) => { rightRefs.current[idx] = el; }}
                                onMouseUp={() => handleMouseUpRight(idx)}
                                className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-colors ${isConnectedRight(idx) ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-400 hover:border-indigo-500"}`}
                            ></div>
                            <div className="content">
                                {renderContent(item)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lines Layer */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                {/* 確定済みの線 */}
                {Object.entries(connections).map(([leftIdx, rightIdx]) => {
                    const start = getCoords(leftRefs.current[Number(leftIdx)], "left");
                    const end = getCoords(rightRefs.current[Number(rightIdx)], "right");
                    return (
                        <line
                            key={`${leftIdx}-${rightIdx}`}
                            x1={start.x} y1={start.y}
                            x2={end.x} y2={end.y}
                            stroke="#4F46E5"
                            strokeWidth="3"
                        />
                    );
                })}

                {/* ドラッグ中の線 */}
                {drawingStart !== null && mousePos && (
                    <line
                        x1={getCoords(leftRefs.current[Number(drawingStart)], "left").x}
                        y1={getCoords(leftRefs.current[Number(drawingStart)], "left").y}
                        x2={mousePos.x}
                        y2={mousePos.y}
                        stroke="#818CF8"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                    />
                )}
            </svg>
        </div>
    );
}

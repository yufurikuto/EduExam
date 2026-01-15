"use client";

import { useEffect, useState } from "react";

interface FillInTheBlankQuestionProps {
    questionId: string;
    text: string; // Text containing {answer} format
    onAnswerChange?: (answers: Record<number, string>) => void;
    readOnly?: boolean;
    initialAnswers?: Record<number, string>;
}

export default function FillInTheBlankQuestion({
    questionId,
    text,
    onAnswerChange,
    readOnly = false,
    initialAnswers = {},
}: FillInTheBlankQuestionProps) {
    const [inputs, setInputs] = useState<Record<number, string>>(initialAnswers);

    // Parse text to identify segments and blanks
    // Example: "Apple is {red}." -> ["Apple is ", "{red}", "."]
    const parts = text.split(/({[^}]+})/g);

    const handleInputChange = (index: number, value: string) => {
        const newInputs = { ...inputs, [index]: value };
        setInputs(newInputs);
        onAnswerChange?.(newInputs);
    };

    // Calculate blank index counter
    let blankCounter = 0;

    return (
        <div className="leading-loose text-lg text-gray-800">
            {parts.map((part, index) => {
                const match = part.match(/^{([^}]+)}$/);
                if (match) {
                    // It's a blank
                    const currentBlankIndex = blankCounter++;
                    const answerLength = match[1].length;
                    // Estimate width based on answer length, min width 4rem
                    const widthStyle = { width: `${Math.max(4, answerLength * 1.5)}rem` };

                    return (
                        <span key={index} className="inline-block mx-1 align-baseline">
                            <span className="text-xs text-gray-400 block text-center mb-0.5 select-none">({currentBlankIndex + 1})</span>
                            <input
                                type="text"
                                value={inputs[currentBlankIndex] || ""}
                                onChange={(e) => handleInputChange(currentBlankIndex, e.target.value)}
                                disabled={readOnly}
                                className="border-b-2 border-gray-400 focus:border-indigo-600 focus:outline-none bg-gray-50 px-2 py-0.5 text-center transition-colors rounded-t"
                                style={widthStyle}
                                autoComplete="off"
                            />
                        </span>
                    );
                } else {
                    // Regular text
                    // Replace newlines with <br/> for proper display if needed, or just whitespace-pre-wrap parent handles it?
                    // The parent has whitespace-pre-wrap, so basic text is fine.
                    return <span key={index}>{part}</span>;
                }
            })}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStudentExam, submitExam } from "@/app/actions/exam";
import OrderingQuestion from "@/components/OrderingQuestion";
import MatchingQuestion from "@/components/MatchingQuestion";
import FillInTheBlankQuestion from "@/components/FillInTheBlankQuestion";
import { Clock } from "lucide-react";

type Question = {
    id: string;
    text: string;
    type: string;
    score: number;
    options?: any; // DB from server action is any for options
    imageUrl?: string | null;
    correctAnswer?: string | null;
};

export default function StudentExamPage({
    params,
}: {
    params: { id: string };
}) {
    const router = useRouter();
    const [studentName, setStudentName] = useState("");
    const [studentNumber, setStudentNumber] = useState("");
    const [isStarted, setIsStarted] = useState(false);

    const [exam, setExam] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExam = async () => {
            const data = await getStudentExam(params.id);
            if (data) {
                setExam(data);
                if (data.questions) {
                    setQuestions(data.questions as any);
                }
                if (data.timeLimit) {
                    setTimeLeft(data.timeLimit * 60); // Convert minutes to seconds
                }
            } else {
                alert("試験が見つかりません");
            }
            setLoading(false);
        };
        fetchExam();
    }, [params.id]);

    // Timer logic
    useEffect(() => {
        if (!isStarted || timeLeft === null || isSubmitted) return;

        if (timeLeft <= 0) {
            alert("制限時間が終了しました！自動的に送信されます。");
            handleSubmit(null); // Auto submit
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isSubmitted, isStarted]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (qId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [qId]: value }));
    };

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentName.trim() || !studentNumber.trim()) {
            alert("出席番号と名前を入力してください。");
            return;
        }
        setIsStarted(true);
    };

    const handleSubmit = async (e: React.FormEvent | null) => {
        if (e) e.preventDefault();

        // Calculate score (Client-side simple grading for now)
        let totalScore = 0;
        let earnedScore = 0;

        questions.forEach(q => {
            totalScore += q.score;
            const userAnswer = answers[q.id];

            // Simple string strict check
            if (userAnswer && q.correctAnswer && userAnswer === q.correctAnswer) {
                earnedScore += q.score;
            } else if (q.type === "MULTIPLE_CHOICE" && userAnswer && q.correctAnswer) {
                // Check if JSON arrays match (sorted)
                try {
                    const u = JSON.parse(userAnswer);
                    const c = JSON.parse(q.correctAnswer);
                    if (Array.isArray(u) && Array.isArray(c)) {
                        if (JSON.stringify(u.sort()) === JSON.stringify(c.sort())) {
                            earnedScore += q.score;
                        }
                    } else if (String(userAnswer) === String(q.correctAnswer)) {
                        earnedScore += q.score;
                    }
                } catch {
                    if (String(userAnswer) === String(q.correctAnswer)) {
                        earnedScore += q.score;
                    }
                }
            }
            // Add more complex grading logic for Matching/Ordering if needed
        });

        // Server save
        const result = await submitExam({
            examId: exam.id,
            studentName,
            studentNumber,
            score: earnedScore,
            answers
        });

        if (!result.success) {
            alert(result.error || "送信に失敗しました");
            return;
        }

        setIsSubmitted(true);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    if (!exam) return <div className="min-h-screen flex items-center justify-center">試験が見つかりません</div>;

    // Student Info Input Screen
    if (!isStarted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-6 text-center">{exam.title}</h1>
                    <p className="mb-6 text-gray-600 text-sm">
                        試験を開始する前に、出席番号と名前を入力してください。<br />
                        制限時間: {exam.timeLimit ? `${exam.timeLimit}分` : '無制限'}
                    </p>
                    <form onSubmit={handleStart} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">出席番号</label>
                            <input
                                type="text"
                                required
                                value={studentNumber}
                                onChange={e => setStudentNumber(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="例: 101"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">名前</label>
                            <input
                                type="text"
                                required
                                value={studentName}
                                onChange={e => setStudentName(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="例: 山田 太郎"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            試験を開始する
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
                    <div className="text-5xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold mb-2">送信完了</h1>
                    <p className="text-gray-600 mb-6">回答を受け付けました。お疲れ様でした。</p>
                    <button onClick={() => window.close()} className="text-indigo-600 hover:text-indigo-800 underline">
                        閉じる
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-10 transition-colors duration-300"
                style={timeLeft !== null && timeLeft < 60 ? { backgroundColor: '#fee2e2' } : {}}
            >
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="font-bold text-gray-800 truncate max-w-xs">{exam.title}</h1>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500 hidden sm:block">
                            {studentNumber} {studentName}
                        </div>
                        {timeLeft !== null && (
                            <div className={`flex items-center font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>
                                <Clock className="w-5 h-5 mr-2" />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {questions.length === 0 && (
                        <div className="text-center py-10">問題がありません。</div>
                    )}

                    {questions.map((q, idx) => {
                        // Parse options if it's a JSON array (from DB) but we need to handle it safely
                        let parsedOptions: any[] = [];
                        if (Array.isArray(q.options)) {
                            parsedOptions = q.options;
                        } else if (typeof q.options === 'string') {
                            try { parsedOptions = JSON.parse(q.options); } catch { }
                        }

                        return (
                            <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex justify-between mb-4">
                                    <span className="font-bold text-lg text-indigo-900 border-b-2 border-indigo-500 pb-1">
                                        第{idx + 1}問
                                    </span>
                                    <span className="text-sm text-gray-500">（配点 {q.score}点）</span>
                                </div>

                                {q.type !== "FILL_IN_THE_BLANK" && (
                                    <p className="mb-6 text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">{q.text}</p>
                                )}

                                {q.imageUrl && (
                                    <div className="mb-6">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={q.imageUrl} alt="Question Reference" className="max-h-64 rounded border border-gray-200" />
                                    </div>
                                )}

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    {q.type === "FILL_IN_THE_BLANK" && (
                                        <FillInTheBlankQuestion
                                            questionId={q.id}
                                            text={q.text}
                                            onAnswerChange={(val) => handleAnswerChange(q.id, JSON.stringify(val))}
                                        />
                                    )}

                                    {q.type === "MULTIPLE_CHOICE" && parsedOptions.length > 0 && (
                                        <div className="space-y-3">
                                            {(() => {
                                                // Determine if multi-select based on correctAnswer format
                                                const isMultiple = q.correctAnswer?.startsWith("[") || false;
                                                // Current answer (string or json string)
                                                const rawAnswer = answers[q.id] || "";
                                                let currentSelection: string[] = [];
                                                if (isMultiple) {
                                                    try {
                                                        const p = JSON.parse(rawAnswer);
                                                        if (Array.isArray(p)) currentSelection = p;
                                                    } catch { }
                                                }

                                                return parsedOptions.map((opt, i) => {
                                                    const valStr = String(i + 1);
                                                    const isChecked = isMultiple
                                                        ? currentSelection.includes(valStr)
                                                        : rawAnswer === valStr;

                                                    return (
                                                        <label key={i} className="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-indigo-50 transition">
                                                            <input
                                                                type={isMultiple ? "checkbox" : "radio"}
                                                                name={`q-${q.id}`}
                                                                value={valStr}
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (isMultiple) {
                                                                        let newSelection = [...currentSelection];
                                                                        if (e.target.checked) {
                                                                            newSelection.push(valStr);
                                                                        } else {
                                                                            newSelection = newSelection.filter(v => v !== valStr);
                                                                        }
                                                                        // Sort to match correct answer format for easy comparison
                                                                        handleAnswerChange(q.id, JSON.stringify(newSelection.sort()));
                                                                    } else {
                                                                        handleAnswerChange(q.id, valStr);
                                                                    }
                                                                }}
                                                                className={`w-5 h-5 text-indigo-600 focus:ring-indigo-500 ${isMultiple ? "rounded" : ""}`}
                                                            />
                                                            <span className="ml-3 text-gray-700">{opt}</span>
                                                        </label>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}

                                    {q.type === "TEXT" && (
                                        <textarea
                                            rows={4}
                                            className="w-full p-3 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="ここに回答を入力してください..."
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        ></textarea>
                                    )}

                                    {q.type === "ORDERING" && parsedOptions.length > 0 && (
                                        <OrderingQuestion
                                            questionId={q.id}
                                            options={parsedOptions}
                                            onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                                        />
                                    )}

                                    {q.type === "MATCHING" && parsedOptions.length > 0 && (
                                        <MatchingQuestion
                                            questionId={q.id}
                                            pairs={parsedOptions.map((opt: any) => {
                                                try {
                                                    // If opt is string json
                                                    if (typeof opt === 'string') return JSON.parse(opt);
                                                    return opt; // if already object
                                                } catch {
                                                    return { left: String(opt), right: String(opt) };
                                                }
                                            })}
                                            onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center shadow-lg z-20">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-105"
                        >
                            回答を送信する
                        </button>
                    </div>
                    <div className="h-20"></div>
                </form>
            </main>
        </div>
    );
}

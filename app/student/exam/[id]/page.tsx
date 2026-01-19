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
    const [studentClass, setStudentClass] = useState("");
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
        if (!studentName.trim() || !studentNumber.trim() || !studentClass.trim()) {
            alert("全ての項目を入力してください。");
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

        // Check for preview mode
        const isPreview = new URLSearchParams(window.location.search).get("mode") === "preview";
        if (isPreview) {
            alert(`[プレビューモード] 送信完了シミュレーション\nスコア: ${earnedScore} / ${totalScore}`);
            setIsSubmitted(true);
            return;
        }

        // Server save
        const result = await submitExam({
            examId: exam.id,
            studentName,
            studentNumber,
            studentClass,
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700">クラス (必須)</label>
                            <input
                                type="text"
                                required
                                value={studentClass}
                                onChange={e => setStudentClass(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="例: 1-A"
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
                    <div className="flex items-center">
                        <h1 className="font-bold text-gray-800 truncate max-w-xs">{exam.title}</h1>
                        {new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get("mode") === "preview" && (
                            <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                プレビューモード
                            </span>
                        )}
                    </div>
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
                <form onSubmit={handleSubmit} className="space-y-12">
                    {questions.length === 0 && (
                        <div className="text-center py-10">問題がありません。</div>
                    )}

                    {questions.map((q, idx) => {
                        let parsedOptions: any[] = [];
                        if (Array.isArray(q.options)) {
                            parsedOptions = q.options;
                        } else if (typeof q.options === 'string') {
                            try { parsedOptions = JSON.parse(q.options); } catch { }
                        }

                        return (
                            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                            {q.type === 'MULTIPLE_CHOICE' ? '選択問題' :
                                                q.type === 'TEXT' ? '記述問題' :
                                                    q.type === 'ORDERING' ? '並び替え' :
                                                        q.type === 'MATCHING' ? '組み合わせ' :
                                                            q.type === 'FILL_IN_THE_BLANK' ? '穴埋め' : '問題'}
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {q.score}点
                                    </span>
                                </div>

                                <div className="p-6 md:p-8">
                                    {q.type !== "FILL_IN_THE_BLANK" && (
                                        <div className="mb-6 text-gray-900 text-lg leading-relaxed font-medium">
                                            {q.text.split('\n').map((line, i) => (
                                                <span key={i}>{line}<br /></span>
                                            ))}
                                        </div>
                                    )}

                                    {q.imageUrl && (
                                        <div className="mb-8">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={q.imageUrl} alt="Question Reference" className="max-h-96 rounded-lg border border-gray-200 shadow-sm" />
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        {q.type === "FILL_IN_THE_BLANK" && (
                                            <FillInTheBlankQuestion
                                                questionId={q.id}
                                                text={q.text}
                                                onAnswerChange={(val) => handleAnswerChange(q.id, JSON.stringify(val))}
                                            />
                                        )}

                                        {q.type === "MULTIPLE_CHOICE" && parsedOptions.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(() => {
                                                    const isMultiple = q.correctAnswer?.startsWith("[") || false;
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
                                                            <label
                                                                key={i}
                                                                className={`
                                                                    relative block p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                                                    ${isChecked
                                                                        ? "border-indigo-600 bg-indigo-50 shadow-sm"
                                                                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                                                    }
                                                                `}
                                                            >
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 flex items-center">
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
                                                                                    handleAnswerChange(q.id, JSON.stringify(newSelection.sort()));
                                                                                } else {
                                                                                    handleAnswerChange(q.id, valStr);
                                                                                }
                                                                            }}
                                                                            className={`h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 ${isMultiple ? "rounded" : "rounded-full"}`}
                                                                        />
                                                                    </div>
                                                                    <div className="ml-3 text-lg text-gray-900 font-medium">
                                                                        {opt}
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}

                                        {q.type === "TEXT" && (
                                            <div className="relative">
                                                <div className="absolute -top-3 left-3 bg-white px-1 text-sm font-medium text-gray-500">回答欄</div>
                                                <textarea
                                                    rows={6}
                                                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-lg leading-relaxed"
                                                    placeholder="回答を入力してください..."
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    style={{ backgroundImage: 'linear-gradient(transparent, transparent 31px, #f0f0f0 31px, #f0f0f0 32px)', backgroundSize: '100% 32px', lineHeight: '32px' }}
                                                ></textarea>
                                            </div>
                                        )}

                                        {q.type === "ORDERING" && parsedOptions.length > 0 && (
                                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                                <OrderingQuestion
                                                    questionId={q.id}
                                                    options={parsedOptions}
                                                    onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                                                />
                                            </div>
                                        )}

                                        {q.type === "MATCHING" && parsedOptions.length > 0 && (
                                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                                <MatchingQuestion
                                                    questionId={q.id}
                                                    pairs={parsedOptions.map((opt: any) => {
                                                        try {
                                                            if (typeof opt === 'string') return JSON.parse(opt);
                                                            return opt;
                                                        } catch {
                                                            return { left: String(opt), right: String(opt) };
                                                        }
                                                    })}
                                                    onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="pb-32 flex justify-center">
                        {/* Spacer for bottom fixed button */}
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg z-20">
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
                            <div className="hidden sm:block text-sm text-gray-500">
                                {Object.keys(answers).length} / {questions.length} 問回答済み
                            </div>
                            <button
                                type="submit"
                                className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                回答を送信する
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}

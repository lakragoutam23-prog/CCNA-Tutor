'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question {
    questionText: string;
    type: 'mcq' | 'multi_select';
    difficulty: 'easy' | 'medium' | 'hard';
    options: string[];
    correctAnswer: string | string[];
    explanation: string;
    points: number;
}

const emptyQuestion: Question = {
    questionText: '',
    type: 'mcq',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 10,
};

export default function NewQuizPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [quiz, setQuiz] = useState({
        title: '',
        description: '',
        topics: [] as string[],
        difficulty: 'intermediate' as const,
        timeLimit: 15,
        passingScore: 70,
        shuffleQuestions: true,
        shuffleOptions: true,
    });

    const [topicInput, setTopicInput] = useState('');
    const [questions, setQuestions] = useState<Question[]>([{ ...emptyQuestion }]);

    const addTopic = () => {
        if (topicInput.trim() && !quiz.topics.includes(topicInput.trim())) {
            setQuiz(q => ({ ...q, topics: [...q.topics, topicInput.trim()] }));
            setTopicInput('');
        }
    };

    const removeTopic = (topic: string) => {
        setQuiz(q => ({ ...q, topics: q.topics.filter(t => t !== topic) }));
    };

    const addQuestion = () => {
        setQuestions(qs => [...qs, { ...emptyQuestion }]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(qs => qs.filter((_, i) => i !== index));
        }
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        setQuestions(qs => qs.map((q, i) => i === index ? { ...q, [field]: value } : q));
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        setQuestions(qs => qs.map((q, i) => {
            if (i === qIndex) {
                const newOptions = [...q.options];
                newOptions[oIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const handleSubmit = async () => {
        setError('');

        // Validation
        if (!quiz.title.trim()) {
            setError('Quiz title is required');
            return;
        }
        if (quiz.topics.length === 0) {
            setError('At least one topic is required');
            return;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim()) {
                setError(`Question ${i + 1}: Question text is required`);
                return;
            }
            if (q.options.filter(o => o.trim()).length < 2) {
                setError(`Question ${i + 1}: At least 2 options are required`);
                return;
            }
            if (!q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)) {
                setError(`Question ${i + 1}: Correct answer is required`);
                return;
            }
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...quiz,
                    questions: questions.map(q => ({
                        ...q,
                        options: q.options.filter(o => o.trim()),
                    })),
                }),
            });

            const data = await res.json();
            if (data.success) {
                router.push('/dashboard/quizzes');
            } else {
                setError(data.error || 'Failed to create quiz');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Create New Quiz</h1>
                    <p className="text-gray-600 dark:text-gray-400">Build a quiz with questions</p>
                </div>
                <Link href="/dashboard/quizzes" className="btn-outline">Cancel</Link>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {/* Quiz Details */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Quiz Details</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title *</label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="e.g., OSPF Fundamentals Quiz"
                            value={quiz.title}
                            onChange={(e) => setQuiz(q => ({ ...q, title: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="input w-full"
                            placeholder="Brief description of the quiz..."
                            value={quiz.description}
                            onChange={(e) => setQuiz(q => ({ ...q, description: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Topics *</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                className="input flex-1"
                                placeholder="Add a topic (e.g., OSPF)"
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                            />
                            <button type="button" className="btn-secondary" onClick={addTopic}>Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {quiz.topics.map(topic => (
                                <span key={topic} className="badge-secondary flex items-center gap-1">
                                    {topic}
                                    <button onClick={() => removeTopic(topic)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Difficulty</label>
                            <select
                                className="input w-full"
                                value={quiz.difficulty}
                                onChange={(e) => setQuiz(q => ({ ...q, difficulty: e.target.value as any }))}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="mixed">Mixed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Time Limit (min)</label>
                            <input
                                type="number"
                                className="input w-full"
                                value={quiz.timeLimit}
                                onChange={(e) => setQuiz(q => ({ ...q, timeLimit: parseInt(e.target.value) || 15 }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Passing Score (%)</label>
                            <input
                                type="number"
                                className="input w-full"
                                value={quiz.passingScore}
                                onChange={(e) => setQuiz(q => ({ ...q, passingScore: parseInt(e.target.value) || 70 }))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
                    <button type="button" className="btn-secondary" onClick={addQuestion}>+ Add Question</button>
                </div>

                <div className="space-y-6">
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="border dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium">Question {qIndex + 1}</span>
                                {questions.length > 1 && (
                                    <button
                                        onClick={() => removeQuestion(qIndex)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Question Text *</label>
                                    <textarea
                                        className="input w-full"
                                        placeholder="Enter the question..."
                                        value={q.questionText}
                                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                                    />
                                </div>

                                <div className="grid md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Type</label>
                                        <select
                                            className="input w-full"
                                            value={q.type}
                                            onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                                        >
                                            <option value="mcq">Multiple Choice</option>
                                            <option value="multi_select">Multi Select</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Difficulty</label>
                                        <select
                                            className="input w-full"
                                            value={q.difficulty}
                                            onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value)}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Points</label>
                                        <input
                                            type="number"
                                            className="input w-full"
                                            value={q.points}
                                            onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 10)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Options</label>
                                    <div className="space-y-2">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-2">
                                                <input
                                                    type={q.type === 'mcq' ? 'radio' : 'checkbox'}
                                                    name={`correct-${qIndex}`}
                                                    checked={
                                                        q.type === 'mcq'
                                                            ? q.correctAnswer === opt
                                                            : Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt)
                                                    }
                                                    onChange={() => {
                                                        if (q.type === 'mcq') {
                                                            updateQuestion(qIndex, 'correctAnswer', opt);
                                                        } else {
                                                            const current = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                                                            const updated = current.includes(opt)
                                                                ? current.filter(a => a !== opt)
                                                                : [...current, opt];
                                                            updateQuestion(qIndex, 'correctAnswer', updated);
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <input
                                                    type="text"
                                                    className="input flex-1"
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    value={opt}
                                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Select the correct answer(s) using the radio/checkbox
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Explanation</label>
                                    <textarea
                                        className="input w-full"
                                        placeholder="Why is this the correct answer?"
                                        value={q.explanation}
                                        onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
                <Link href="/dashboard/quizzes" className="btn-outline">Cancel</Link>
                <button
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? 'Creating...' : 'Create Quiz'}
                </button>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Quiz {
    id: string;
    title: string;
    description: string;
    topics: string[];
    questionCount: number;
    difficulty: string;
    timeLimit: number;
    passingScore: number;
    status: 'draft' | 'published';
    createdAt: string;
}

export default function QuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQuizzes = async () => {
        try {
            const res = await fetch('/api/admin/quizzes');
            const data = await res.json();
            if (data.success) {
                setQuizzes(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/quizzes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                fetchQuizzes();
            }
        } catch (error) {
            console.error('Status update failed:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quiz?')) return;

        try {
            const res = await fetch(`/api/admin/quizzes?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchQuizzes();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Quizzes</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage quiz content</p>
                </div>
                <Link href="/dashboard/quizzes/new" className="btn-primary">
                    + Create Quiz
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-cisco-blue border-t-transparent rounded-full" />
                </div>
            ) : quizzes.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-5xl mb-4">⚡</div>
                    <h2 className="text-xl font-semibold mb-2">No quizzes yet</h2>
                    <p className="text-gray-500 mb-4">Create your first quiz to get started</p>
                    <Link href="/dashboard/quizzes/new" className="btn-primary">
                        Create Quiz
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quizzes.map(quiz => (
                        <div key={quiz.id} className="card p-5 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg">{quiz.title}</h3>
                                <button
                                    onClick={() => handleStatusChange(quiz.id, quiz.status === 'published' ? 'draft' : 'published')}
                                    className={`text-xs px-2 py-1 rounded-full ${quiz.status === 'published'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {quiz.status}
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{quiz.description || 'No description'}</p>

                            <div className="flex flex-wrap gap-1 mb-3">
                                {quiz.topics.map(topic => (
                                    <span key={topic} className="badge-secondary text-xs">{topic}</span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                <span>{quiz.questionCount} questions</span>
                                <span>{quiz.timeLimit} min</span>
                                <span className="capitalize">{quiz.difficulty}</span>
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t dark:border-gray-700">
                                <button
                                    onClick={() => handleDelete(quiz.id)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

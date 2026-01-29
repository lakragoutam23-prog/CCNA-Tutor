'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Quiz {
    id: string;
    title: string;
    description?: string;
    topics: string[];
    questionCount: number;
    timeLimit?: number;
    passingScore: number;
}

export default function QuizListPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await fetch('/api/quiz?module=ccna');
                const data = await response.json();
                if (data.success) {
                    setQuizzes(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch quizzes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">Practice Quizzes</h1>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Sample quizzes if none from API
    const displayQuizzes: Quiz[] = quizzes.length > 0 ? quizzes : [
        { id: '1', title: 'Network Fundamentals', description: 'OSI model, TCP/IP, and basic networking concepts', topics: ['OSI', 'TCP/IP'], questionCount: 10, timeLimit: 15, passingScore: 70 },
        { id: '2', title: 'Subnetting Practice', description: 'IPv4 subnetting and CIDR calculations', topics: ['Subnetting'], questionCount: 15, timeLimit: 20, passingScore: 70 },
        { id: '3', title: 'VLANs & Trunking', description: 'VLAN configuration and 802.1Q trunking', topics: ['VLAN'], questionCount: 10, timeLimit: 12, passingScore: 70 },
        { id: '4', title: 'OSPF Routing', description: 'Single-area OSPF configuration and concepts', topics: ['OSPF'], questionCount: 12, timeLimit: 15, passingScore: 70 },
        { id: '5', title: 'Security Basics', description: 'ACLs, NAT, and security fundamentals', topics: ['Security', 'NAT'], questionCount: 10, timeLimit: 12, passingScore: 70 },
        { id: '6', title: 'Mixed Review', description: 'Random questions from all CCNA topics', topics: ['Mixed'], questionCount: 20, timeLimit: 25, passingScore: 70 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Practice Quizzes</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Test your knowledge with topic-specific quizzes
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayQuizzes.map((quiz) => (
                    <div key={quiz.id} className="card p-6 hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold mb-2">{quiz.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {quiz.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {quiz.topics.map((topic) => (
                                <span key={topic} className="badge-secondary">{topic}</span>
                            ))}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <span>{quiz.questionCount} questions</span>
                            {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
                        </div>
                        <Link href={`/learn/quiz/${quiz.id}`} className="btn-primary w-full text-center">
                            Start Quiz
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

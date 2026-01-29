'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ExamModePage() {
    const [selectedExam, setSelectedExam] = useState<string | null>(null);

    const exams = [
        {
            id: 'ccna-full',
            title: 'Full CCNA Practice Exam',
            description: 'Simulate the real CCNA exam experience',
            questions: 100,
            timeLimit: 120,
            topics: ['All Topics'],
        },
        {
            id: 'ccna-network',
            title: 'Network Fundamentals Exam',
            description: 'Focus on OSI model, TCP/IP, and networking basics',
            questions: 25,
            timeLimit: 30,
            topics: ['Network Fundamentals'],
        },
        {
            id: 'ccna-routing',
            title: 'IP Connectivity & Routing Exam',
            description: 'Test your routing and switching knowledge',
            questions: 25,
            timeLimit: 30,
            topics: ['IP Connectivity', 'Network Access'],
        },
        {
            id: 'ccna-security',
            title: 'Security Fundamentals Exam',
            description: 'Security, ACLs, and threat mitigation',
            questions: 20,
            timeLimit: 25,
            topics: ['Security Fundamentals'],
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Exam Mode</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Practice with timed, exam-like conditions
                </p>
            </div>

            {/* Exam Rules */}
            <div className="card p-6 bg-gradient-to-r from-cisco-blue/10 to-transparent border-l-4 border-cisco-blue">
                <h2 className="font-semibold mb-2">📋 Exam Rules</h2>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Timer runs continuously once started</li>
                    <li>• No going back to previous questions</li>
                    <li>• Results shown only after completion</li>
                    <li>• Passing score: 70%</li>
                </ul>
            </div>

            {/* Exam Options */}
            <div className="grid md:grid-cols-2 gap-4">
                {exams.map((exam) => (
                    <div
                        key={exam.id}
                        className={`card p-6 cursor-pointer transition-all hover:shadow-lg ${selectedExam === exam.id
                                ? 'ring-2 ring-cisco-blue'
                                : ''
                            }`}
                        onClick={() => setSelectedExam(exam.id)}
                    >
                        <h3 className="text-lg font-semibold mb-2">{exam.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {exam.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {exam.topics.map((topic) => (
                                <span key={topic} className="badge-secondary">
                                    {topic}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{exam.questions} questions</span>
                            <span>{exam.timeLimit} minutes</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Start Button */}
            {selectedExam && (
                <div className="flex justify-center">
                    <Link
                        href={`/learn/exam/${selectedExam}`}
                        className="btn-primary px-8 py-3 text-lg"
                    >
                        Start Exam
                    </Link>
                </div>
            )}
        </div>
    );
}

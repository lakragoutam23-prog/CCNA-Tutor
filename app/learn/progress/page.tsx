'use client';

import { useState, useEffect } from 'react';

interface ProgressData {
    currentStreak: number;
    longestStreak: number;
    totalTimeSpent: number;
    level: number;
    experiencePoints: number;
    topicsCompleted: number;
    quizStats?: {
        totalTaken: number;
        avgScore: number;
        passCount: number;
        passRate: number;
    };
    labStats?: {
        totalAttempted: number;
        completed: number;
    };
    topics?: Array<{
        topic: string;
        masteryLevel: number;
    }>;
}

const CCNA_TOPICS = [
    'Network Fundamentals',
    'Network Access',
    'IP Connectivity',
    'IP Services',
    'Security Fundamentals',
    'Automation & Programmability',
];

export default function ProgressPage() {
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const response = await fetch('/api/progress');
                const data = await response.json();
                if (data.success) {
                    setProgress(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch progress:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, []);

    const topics = CCNA_TOPICS.map(name => {
        const found = progress?.topics?.find(t => t.topic === name);
        return {
            name,
            progress: found?.masteryLevel || 0,
        };
    });

    // Calculate XP progress to next level (100 XP per level)
    const xpInCurrentLevel = (progress?.experiencePoints || 0) % 100;
    const xpToNextLevel = 100 - xpInCurrentLevel;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-cisco-blue border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Your Progress</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Track your CCNA learning journey
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total XP', value: progress?.experiencePoints || 0, icon: '⭐' },
                    { label: 'Current Level', value: progress?.level || 1, icon: '🏆' },
                    { label: 'Day Streak', value: progress?.currentStreak || 0, icon: '🔥' },
                    { label: 'Quizzes Done', value: progress?.quizStats?.totalTaken || 0, icon: '✅' },
                ].map((stat) => (
                    <div key={stat.label} className="card p-4 text-center">
                        <div className="text-2xl mb-1">{stat.icon}</div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Level Progress */}
            <div className="card p-6">
                <h2 className="font-semibold mb-4">Level Progress</h2>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-cisco-blue flex items-center justify-center text-white text-2xl font-bold">
                        {progress?.level || 1}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                            <span>Level {progress?.level || 1}</span>
                            <span>Level {(progress?.level || 1) + 1}</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${xpInCurrentLevel}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {xpToNextLevel} XP to next level
                        </p>
                    </div>
                </div>
            </div>

            {/* Topic Progress */}
            <div className="card p-6">
                <h2 className="font-semibold mb-4">Topic Mastery</h2>
                <div className="space-y-4">
                    {topics.map((topic) => (
                        <div key={topic.name}>
                            <div className="flex justify-between text-sm mb-1">
                                <span>{topic.name}</span>
                                <span>{topic.progress}%</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${topic.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Summary */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="card p-6">
                    <h2 className="font-semibold mb-4">Quiz Performance</h2>
                    <div className="text-center py-4">
                        <div className="text-4xl font-bold text-cisco-blue">
                            {progress?.quizStats?.avgScore || 0}%
                        </div>
                        <p className="text-gray-500">Average Score</p>
                        <p className="text-sm text-gray-400 mt-2">
                            {progress?.quizStats?.totalTaken || 0} quizzes completed
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                            {progress?.quizStats?.passCount || 0} passed ({progress?.quizStats?.passRate || 0}% pass rate)
                        </p>
                    </div>
                </div>

                <div className="card p-6">
                    <h2 className="font-semibold mb-4">Lab Practice</h2>
                    <div className="text-center py-4">
                        <div className="text-4xl font-bold text-cisco-blue">
                            {progress?.labStats?.completed || 0}
                        </div>
                        <p className="text-gray-500">Labs Completed</p>
                        <p className="text-sm text-gray-400 mt-2">
                            {progress?.labStats?.totalAttempted || 0} labs attempted
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {Math.floor((progress?.totalTimeSpent || 0) / 60)}h {(progress?.totalTimeSpent || 0) % 60}m study time
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

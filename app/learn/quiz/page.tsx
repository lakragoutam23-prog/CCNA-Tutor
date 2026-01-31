'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ClipboardList,
    Clock,
    Target,
    Zap,
    ChevronRight,
    Sparkles,
    Flame,
    FileCheck,
    Brain,
    Search,
    BookOpen
} from 'lucide-react';

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

    const displayQuizzes: Quiz[] = quizzes.length > 0 ? quizzes : [
        { id: '1', title: 'Network Fundamentals', description: 'OSI model, TCP/IP, and basic networking concepts', topics: ['OSI', 'TCP/IP'], questionCount: 10, timeLimit: 15, passingScore: 70 },
        { id: '2', title: 'IPv4 Addressing', description: 'IPv4 addressing, subnetting, and CIDR calculations', topics: ['IPv4', 'Subnetting'], questionCount: 15, timeLimit: 20, passingScore: 70 },
        { id: '4', title: 'VLANs & Trunking', description: 'VLAN configuration and 802.1Q trunking', topics: ['VLAN', '802.1Q'], questionCount: 10, timeLimit: 12, passingScore: 70 },
        { id: '9', title: 'OSPF Routing', description: 'Single-area OSPF configuration and concepts', topics: ['OSPF'], questionCount: 12, timeLimit: 15, passingScore: 70 },
        { id: '15', title: 'Access Control Lists', description: 'Standard and Extended ACL configuration', topics: ['ACL', 'Security'], questionCount: 12, timeLimit: 15, passingScore: 70 },
        { id: '23', title: 'CCNA Practice Exam 1', description: 'Full-length practice exam simulation', topics: ['Exam'], questionCount: 50, timeLimit: 60, passingScore: 70 },
    ];

    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                            <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Assessment Center</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        Practice <span className="text-cisco-blue">Quizzes</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-medium">
                        Sharpen your skills with targeted assessments. From modular topics to full-length simulations.
                    </p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 glass rounded-2xl border-white/40">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search quizzes..."
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium"
                    />
                </div>
            </div>

            {/* Featured Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cisco-blue opacity-5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-indigo-500/10 border border-white/10 flex items-center justify-center text-cisco-blue shadow-inner relative group">
                        <Brain className="w-12 h-12 sm:w-16 sm:h-16 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-cisco-blue/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cisco-blue text-white text-[10px] font-black uppercase rounded-lg tracking-widest">Live Simulation</div>
                        <h2 className="text-3xl md:text-4xl font-black leading-tight">Comprehensive <br /> CCNA Practice Exam</h2>
                        <p className="text-slate-400 text-sm max-w-xl mx-auto md:mx-0">
                            Simulate the actual 200-301 testing environment. 50 questions, weighted categories, and a 60-minute countdown to mirror the real pressure.
                        </p>
                        <Link href="/learn/quiz/23" className="btn-premium py-4 px-10 text-xs">
                            Deploy Exam Simulation <ChevronRight className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Quiz Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayQuizzes.map((quiz, index) => {
                    const isExam = quiz.title.includes('Exam');

                    return (
                        <motion.div
                            key={quiz.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card flex flex-col p-8 group border-white/40 hover:border-cisco-blue"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isExam ? 'bg-indigo-500/10 text-indigo-500' : 'bg-cisco-blue/10 text-cisco-blue'
                                    }`}>
                                    {quiz.topics[0]}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" /> {quiz.timeLimit} Min
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-cisco-blue transition-colors">
                                {quiz.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                                {quiz.description}
                            </p>

                            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                    <FileCheck className="w-4 h-4 text-emerald-500" /> {quiz.questionCount} Questions
                                </div>
                                <Link
                                    href={`/learn/quiz/${quiz.id}`}
                                    className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white hover:text-cisco-blue transition-colors"
                                >
                                    Start Session <ChevronRight className="w-4 h-4 text-cisco-blue" />
                                </Link>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

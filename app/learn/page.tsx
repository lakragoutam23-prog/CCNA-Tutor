'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Target,
    Trophy,
    Calendar,
    ChevronRight,
    Sparkles,
    Flame,
    Layout,
    Terminal,
    MessageSquare,
    BookOpen,
    Zap,
    Loader2
} from 'lucide-react';

const STATIC_STATS = [
    { label: 'Overall Progress', value: '19%', icon: Target, color: 'text-cisco-blue' },
    { label: 'Skill Level', value: 'Novice', icon: Trophy, color: 'text-amber-500' },
    { label: 'Day Streak', value: '1 Day', icon: Flame, color: 'text-rose-500' },
    { label: 'Next Goal', value: 'OSI Model', icon: Sparkles, color: 'text-violet-500' },
];

const DOMAINS = [
    { id: '1', title: 'Network Fundamentals', progress: 33 },
    { id: '2', title: 'Network Access', progress: 25 },
    { id: '3', title: 'IP Connectivity', progress: 10 },
    { id: '4', title: 'IP Services', progress: 0 },
];

const QUICK_ACTIONS = [
    { title: 'Resume Lab', subtitle: 'Basic OSPF Config', icon: Terminal, href: '/learn/labs' },
    { title: 'AI Assistant', subtitle: 'Ask about VLANs', icon: MessageSquare, href: '/learn/tutor' },
    { title: 'Daily Quiz', subtitle: '10 questions', icon: Layout, href: '/learn/quiz' },
];

export default function StudentDashboard() {
    const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/session');
                const data = await response.json();
                if (data.success) {
                    setUser(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch user', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cisco-blue animate-spin" />
            </div>
        );
    }

    const displayName = user?.name || user?.email?.split('@')[0] || 'Student';

    return (
        <div className="space-y-10 pb-10">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-cisco-blue font-black uppercase tracking-[0.2em] text-xs mb-2"
                    >
                        System Status: Active
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
                    >
                        Welcome back, <span className="text-cisco-blue capitalize">{displayName}</span>.
                    </motion.h2>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm"
                >
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATIC_STATS.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card group border-white/40 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</h3>
                        <p className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-cisco-blue transition-colors">
                            {stat.value}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Learning Journey (Larger Card) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card relative overflow-hidden h-full flex flex-col border-white/40">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cisco-blue/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 flex-1">
                            <div className="space-y-6 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-cisco-blue text-white text-[10px] font-black uppercase rounded-lg tracking-widest">Active Module</div>
                                    <span className="text-slate-400 text-xs font-bold">• Continued Learning</span>
                                </div>

                                <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                    Domain 1.0: Network <br /> Fundamentals
                                </h2>

                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
                                    Start your journey by mastering the basics of networking protocols, the OSI model, and TCP/IP.
                                </p>

                                <div className="flex items-center gap-4">
                                    <Link href="/learn/topics" className="btn-premium py-3 px-8 text-sm">
                                        Resume Learning <ChevronRight className="ml-2 w-4 h-4" />
                                    </Link>
                                    <button className="p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <Layout className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Circular Progress (Desktop Only) */}
                            <div className="relative hidden md:flex items-center justify-center p-8">
                                <svg className="w-48 h-48 -rotate-90">
                                    <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                                    <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={502} strokeDashoffset={502 * (1 - 0.33)} strokeLinecap="round" className="text-cisco-blue drop-shadow-[0_0_10px_rgba(4,159,217,0.5)]" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">33%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Module 1</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {QUICK_ACTIONS.map((action, i) => (
                            <motion.div
                                key={action.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                            >
                                <Link
                                    href={action.href}
                                    className="glass-card flex flex-col items-center text-center p-8 group hover:border-cisco-blue"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:text-cisco-blue">
                                        <action.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{action.title}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{action.subtitle}</p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Content (Stat Lists) */}
                <div className="space-y-8">
                    {/* Domain Progress */}
                    <div className="glass-card border-white/40">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-cisco-blue" />
                            Domain Mastery
                        </h3>

                        <div className="space-y-6">
                            {DOMAINS.map((domain) => (
                                <div key={domain.id} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-600 dark:text-slate-300">{domain.title}</span>
                                        <span className="text-cisco-blue">{domain.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${domain.progress}%` }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="h-full bg-gradient-to-r from-cisco-blue to-cyan-400 rounded-full shadow-[0_0_10px_rgba(4,159,217,0.3)]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link href="/learn/topics" className="mt-8 block text-center text-xs font-black text-cisco-blue hover:underline uppercase tracking-widest">
                            View Full Curriculum
                        </Link>
                    </div>

                    {/* Recent Activity */}
                    <div className="glass-card border-white/40">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-cisco-blue" />
                            Live Feed
                        </h3>

                        <div className="space-y-6">
                            {[
                                { type: 'login', text: 'Started a new session', date: 'Just now' },
                                { type: 'view', text: 'Viewed Learning Dashboard', date: '1m ago' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="w-2 h-2 rounded-full bg-cisco-blue mt-1.5 group-hover:scale-150 transition-transform"></div>
                                    <div className="flex-1 border-b border-slate-100 dark:border-white/5 pb-4">
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors group-hover:text-cisco-blue">{item.text}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

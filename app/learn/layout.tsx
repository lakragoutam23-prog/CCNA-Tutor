'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    BookOpen,
    Terminal,
    ClipboardList,
    MessageSquare,
    Trophy,
    User,
    LogOut,
    Menu,
    X,
    Sparkles,
    Zap,
    Globe,
    Bell,
    ShieldCheck
} from 'lucide-react';

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/learn' },
    { icon: BookOpen, label: 'Curriculum', href: '/learn/topics' },
    { icon: MessageSquare, label: 'AI Tutor', href: '/learn/tutor' },
    { icon: Terminal, label: 'Labs', href: '/learn/labs' },
    { icon: ClipboardList, label: 'Quizzes', href: '/learn/quiz' },
    { icon: Trophy, label: 'Achievements', href: '/learn/achievements' },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState<{ name?: string; email?: string, role?: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/session');
                const data = await response.json();
                if (data.success) {
                    setUser(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch session", error);
            }
        };
        fetchUser();
    }, []);

    const displayName = user?.name || user?.email?.split('@')[0] || 'Student';
    const initials = displayName.slice(0, 2).toUpperCase();
    const isAdmin = user?.role && ['admin', 'super_admin', 'content_admin'].includes(user.role);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
            {/* Sidebar Overlay (Mobile) */}
            <AnimatePresence>
                {!isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarOpen ? '280px' : '0px',
                    opacity: isSidebarOpen ? 1 : 0
                }}
                className="fixed inset-y-0 left-0 z-50 lg:relative flex flex-col glass border-r border-white/40 dark:border-white/5 shadow-2xl overflow-hidden"
            >
                {/* Brand */}
                <div className="p-8 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-cisco-blue to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
                            <Globe className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                            CCNA<span className="text-cisco-blue">Tutor</span>
                        </span>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-cisco-blue text-white shadow-lg shadow-cisco-blue/20'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-bold text-sm tracking-wide">{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-white/10 rounded-xl pointer-events-none"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-6 border-t border-white/40 dark:border-white/5 space-y-4">
                    {/* Admin Link (Conditional) */}
                    {isAdmin && (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-lg mb-2 group hover:scale-[1.02] transition-transform"
                        >
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <div className="flex-1">
                                <p className="text-xs font-black uppercase tracking-widest">Admin Panel</p>
                                <p className="text-[10px] text-slate-400">Manage Platform</p>
                            </div>
                        </Link>
                    )}

                    <div className="space-y-1">
                        <Link href="/learn/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                        </Link>
                        <Link href="/login" className="flex items-center gap-3 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </Link>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Topheader */}
                <header className="h-20 glass border-b border-white/40 dark:border-white/5 px-8 flex items-center justify-between z-30">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm"
                            >
                                <Menu className="w-6 h-6 text-slate-600" />
                            </button>
                        )}
                        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {MENU_ITEMS.find(item => item.href === pathname)?.label || 'Learning Hub'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Avatar */}
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-slate-900 dark:text-white capitalize">{displayName}</p>
                                <p className="text-[10px] font-bold text-cisco-blue uppercase tracking-tighter">Student Member</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cisco-blue to-cyan-400 p-[2px] shadow-sm">
                                <div className="w-full h-full rounded-[9px] bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500">
                                    {initials}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}

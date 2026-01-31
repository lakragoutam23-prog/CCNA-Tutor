'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Target,
    Zap,
    Terminal,
    BookOpen,
    Trophy,
    ClipboardCheck,
    ChevronRight,
    ArrowRight,
    ShieldCheck,
    Globe
} from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
    return (
        <div className="min-h-screen selection:bg-cisco-blue selection:text-white">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cisco-blue/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-center">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-6xl glass rounded-3xl px-6 py-3 flex items-center justify-between border border-white/40 shadow-lg"
                >
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-cisco-blue to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
                            <Globe className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                            CCNA<span className="text-cisco-blue">Tutor</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <Link href="#features" className="hover:text-cisco-blue transition-colors">Features</Link>
                        <Link href="#curriculum" className="hover:text-cisco-blue transition-colors">Curriculum</Link>
                        <Link href="#testimonials" className="hover:text-cisco-blue transition-colors">Success Stories</Link>
                    </div>

                    <Link href="/login" className="btn-premium py-2 px-6 text-sm">
                        Launch Platform
                    </Link>
                </motion.div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div className="container mx-auto">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto text-center"
                    >
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cisco-blue/10 border border-cisco-blue/20 text-cisco-blue text-sm font-bold mb-8"
                        >
                            <Zap className="w-4 h-4" />
                            <span>Next-Gen AI Learning Platform</span>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8"
                        >
                            Master Networking with
                            <span className="heading-shine italic block mt-4">Precision Intelligence</span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
                        >
                            The industry's most advanced CCNA simulator. Combining real-time AI tutoring,
                            live CLI practice, and adaptive curriculum to guarantee your certification success.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center justify-center gap-6"
                        >
                            <Link href="/login" className="btn-premium btn-lg w-full sm:w-auto group">
                                Start Your Journey <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link href="#features" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold hover:text-cisco-blue transition-colors">
                                Watch Demo <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center">▶</div>
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Abstract Device Mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="mt-20 max-w-6xl mx-auto relative"
                    >
                        <div className="glass-card p-2 border-white/20 shadow-[0_0_100px_rgba(4,159,217,0.2)]">
                            <div className="bg-slate-900 rounded-xl overflow-hidden aspect-[16/9] border border-white/5 relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-cisco-blue/20 via-transparent to-indigo-500/20"></div>
                                {/* Visual Representation of CLI/Topology */}
                                <div className="absolute top-10 left-10 p-6 glass max-w-xs rounded-xl border-white/10 hidden md:block">
                                    <Terminal className="w-8 h-8 text-emerald-400 mb-4" />
                                    <div className="font-mono text-[10px] text-slate-400 space-y-1">
                                        <p className="text-emerald-400">R1# config t</p>
                                        <p>Enter configuration commands, one per line.</p>
                                        <p className="text-emerald-400">R1(config)# int gi0/0</p>
                                    </div>
                                </div>
                                <div className="h-full flex items-center justify-center text-8xl opacity-10 font-bold text-white">
                                    NETWORK_CORE
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Feature Grid */}
            <section id="features" className="py-32 px-6">
                <div className="container mx-auto text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                        Engineered for <span className="text-cisco-blue underline decoration-wavy underline-offset-8">Results</span>
                    </h2>
                    <p className="text-slate-500 max-w-xl mx-auto">Every tool you need to go from networking novice to certified professional.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {[
                        {
                            icon: <Zap className="w-6 h-6 text-orange-500" />,
                            title: "AI-Powered Mentor",
                            desc: "Get context-aware help on any topic, configuration, or scenario instantly.",
                            color: "bg-orange-500"
                        },
                        {
                            icon: <Terminal className="w-6 h-6 text-emerald-500" />,
                            title: "True-to-Life CLI",
                            desc: "A fully functional Cisco IOS simulator to practice commands safely.",
                            color: "bg-emerald-500"
                        },
                        {
                            icon: <Target className="w-6 h-6 text-cisco-blue" />,
                            title: "Adaptive Exams",
                            desc: "Question banks that evolve based on your performance to bridge gaps.",
                            color: "bg-cisco-blue"
                        },
                        {
                            icon: <BookOpen className="w-6 h-6 text-violet-500" />,
                            title: "Interactive Path",
                            desc: "Visual curriculum that tracks every domain of the 200-301 blueprint.",
                            color: "bg-violet-500"
                        },
                        {
                            icon: <Trophy className="w-6 h-6 text-amber-500" />,
                            title: "Smart Streak",
                            desc: "Gamified learning journey with achievements that keep you motivated.",
                            color: "bg-amber-500"
                        },
                        {
                            icon: <ShieldCheck className="w-6 h-6 text-indigo-500" />,
                            title: "Exam Readiness",
                            desc: "Detailed probability score showing exactly when you're ready to test.",
                            color: "bg-indigo-500"
                        }
                    ].map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card group"
                        >
                            <div className={`w-12 h-12 rounded-2xl ${f.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto">
                    <div className="max-w-6xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-cisco-blue/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                                Ready to Level Up Your Career?
                            </h2>
                            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
                                Join thousands of students globally. Your Cisco certification journey starts with a single click.
                            </p>
                            <Link href="/login" className="btn-premium btn-lg">
                                Get Started for Free <ChevronRight className="ml-2 w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Globe className="w-8 h-8 text-cisco-blue" />
                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            CCNA<span className="text-cisco-blue">Tutor</span>
                        </span>
                    </div>
                    <div className="flex gap-8 text-sm text-slate-500">
                        <Link href="#" className="hover:text-cisco-blue">Terms</Link>
                        <Link href="#" className="hover:text-cisco-blue">Privacy</Link>
                        <Link href="#" className="hover:text-cisco-blue">Discord</Link>
                    </div>
                    <p className="text-slate-400 text-sm">
                        © {new Date().getFullYear()} CCNA Tutor. Engineered for Excellence.
                    </p>
                </div>
            </footer>
        </div>
    );
}

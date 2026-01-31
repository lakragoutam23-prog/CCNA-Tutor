'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    Mail,
    Lock,
    User,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    Loader2
} from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
            const body = isSignUp
                ? { email, password, name: name || email.split('@')[0] }
                : { email, password };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Authentication failed');
            }

            if (isSignUp) {
                setMessage('Account created! Redirecting...');
            }

            router.push(data.redirectUrl || '/learn');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 selection:bg-cisco-blue selection:text-white bg-slate-950">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[50%] h-[50%] bg-cisco-blue/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[20%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-[1200px] grid lg:grid-cols-2 gap-12 items-center relative z-10">

                {/* Left Side: Branding & Info (Hidden on Mobile) */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:flex flex-col space-y-12"
                >
                    <Link href="/" className="flex items-center gap-3 self-start group">
                        <div className="w-12 h-12 bg-gradient-to-br from-cisco-blue to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cisco-blue/20 transition-transform group-hover:rotate-12">
                            <Globe className="w-7 h-7" />
                        </div>
                        <span className="text-3xl font-black text-white tracking-tight">CCNA<span className="text-cisco-blue">Tutor</span></span>
                    </Link>

                    <div className="space-y-8">
                        <h1 className="text-5xl font-black text-white leading-[1.2] tracking-tight">
                            The future of <br /> Cisco Networking <br />
                            <span className="text-cisco-blue italic">begins here.</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-md leading-relaxed">
                            Join 10,000+ students mastering CCNA 200-301 with our industry-leading AI platform.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="glass-card p-6 border-white/5">
                            <p className="text-2xl font-black text-white">98%</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Pass Rate</p>
                        </div>
                        <div className="glass-card p-6 border-white/5">
                            <p className="text-2xl font-black text-white">24/7</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">AI Support</p>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Auth Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="glass-card p-8 md:p-12 border-white/10 shadow-[0_0_80px_rgba(4,159,217,0.1)]">

                        {/* Form Header */}
                        <div className="text-center mb-10">
                            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                                <Globe className="w-10 h-10 text-cisco-blue" />
                                <span className="text-2xl font-black text-white">CCNA Tutor</span>
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                                {isSignUp ? 'Create Account' : 'Welcome Back'}
                            </h2>
                            <p className="text-slate-500 font-medium italic">
                                {isSignUp ? 'Start your journey to certification.' : 'Great to see you again!'}
                            </p>
                        </div>

                        {/* Auth Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence mode='wait'>
                                {isSignUp && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        key="name-field"
                                        className="space-y-1.5"
                                    >
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cisco-blue transition-colors" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="John Doe"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-cisco-blue/30 focus:border-cisco-blue transition-all"
                                                required={isSignUp}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cisco-blue transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="alex@network.com"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-cisco-blue/30 focus:border-cisco-blue transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                                    {!isSignUp && <button type="button" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest">Forgot?</button>}
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cisco-blue transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-cisco-blue/30 focus:border-cisco-blue transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Status messages */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold"
                                    >
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold"
                                    >
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        {message}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-premium py-4 group"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        {isSignUp ? 'Create Free Account' : 'Sign into Dashboard'} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-white/5 text-center">
                            <p className="text-sm font-bold text-slate-600 tracking-tight">
                                {isSignUp ? 'Already on board?' : 'New to the platform?'}
                                <button
                                    onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
                                    className="ml-2 text-cisco-blue hover:text-white transition-colors"
                                >
                                    {isSignUp ? 'Sign In' : 'Join for Free'}
                                </button>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-6">
                        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                            <ChevronLeft className="w-3 h-3" /> Back to Home
                        </Link>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

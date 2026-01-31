'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Award, Zap, Camera, Settings } from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
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
            <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cisco-blue"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Please log in to view your profile.</h2>
            </div>
        );
    }

    const initials = (user.name || user.email || 'U').substring(0, 2).toUpperCase();

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    My <span className="text-cisco-blue">Profile</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your personal information and account settings.</p>
            </div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 md:p-12 relative overflow-hidden border-white/40"
            >
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-cisco-blue to-cyan-400"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8 mt-12">
                    <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-900 p-1.5 shadow-xl rotate-3">
                        <div className="w-full h-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl font-black text-slate-400 uppercase tracking-widest relative group cursor-pointer overflow-hidden">
                            {initials}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left mb-2">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">{user.name || 'Student Name'}</h2>
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4" /> {user.email}
                        </p>
                    </div>

                    <button className="btn-premium px-6 py-3 text-xs flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Edit Profile
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 text-slate-600 dark:text-slate-300">
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-cisco-blue mb-6 border-b border-cisco-blue/20 pb-2">Account Details</h3>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">Full Name</p>
                                <p className="font-bold">{user.name || 'Not set'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">Account Role</p>
                                <p className="font-bold capitalize">{user.role?.replace('_', ' ') || 'Student'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-cisco-blue mb-6 border-b border-cisco-blue/20 pb-2">Activity Stats</h3>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">Member Since</p>
                                <p className="font-bold">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Award className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">Certification Path</p>
                                <p className="font-bold">CCNA 200-301</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

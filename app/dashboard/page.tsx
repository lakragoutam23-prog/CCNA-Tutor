'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Users,
    Terminal,
    Layout,
    BarChart3,
    ArrowUpRight,
    Activity,
    Zap,
    Shield,
    Globe,
    Plus,
    Search,
    MoreVertical
} from 'lucide-react';

const ADMIN_STATS = [
    { label: 'Total Students', value: '2,482', change: '+12%', icon: Users, color: 'text-cisco-blue' },
    { label: 'Labs Created', value: '1,240', change: '+5%', icon: Terminal, color: 'text-emerald-500' },
    { label: 'Active Sessions', value: '450', change: '+18%', icon: Activity, color: 'text-orange-500' },
    { label: 'Platform Health', value: '99.9%', change: 'Stable', icon: Shield, color: 'text-violet-500' },
];

const RECENT_USERS = [
    { name: 'Alex Networker', email: 'alex@example.com', role: 'Student', status: 'Active' },
    { name: 'Sarah Tech', email: 'sarah@example.com', role: 'Staff', status: 'Active' },
    { name: 'Michael Smith', email: 'mike@example.com', role: 'Student', status: 'Inactive' },
    { name: 'Emma Jordan', email: 'emma@example.com', role: 'Student', status: 'Active' },
];

export default function AdminDashboard() {
    return (
        <div className="space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        System <span className="text-cisco-blue">Intelligence</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Platform overview and real-time performance metrics</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 hover:bg-slate-50 transition-colors">
                        <BarChart3 className="w-4 h-4" /> Export Data
                    </button>
                    <Link href="/dashboard/labs" className="btn-premium py-2.5 px-6 text-sm">
                        <Plus className="w-4 h-4 mr-2" /> New Resource
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {ADMIN_STATS.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card group border-white/40"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</h3>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Real-time Analytics & Users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Traffic Visualization (Mockup) */}
                <div className="lg:col-span-2 glass-card border-white/40 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">User Retention</h3>
                            <p className="text-xs text-slate-500">Weekly active user growth</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                            <div className="flex items-center gap-1.5 leading-none">
                                <div className="w-2.5 h-2.5 rounded-full bg-cisco-blue"></div> Target
                            </div>
                            <div className="flex items-center gap-1.5 leading-none px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-white/5">
                                Monthly View
                            </div>
                        </div>
                    </div>

                    {/* Abstract Chart Representation */}
                    <div className="h-64 flex items-end gap-3 px-2">
                        {[40, 65, 45, 80, 55, 90, 70, 40, 85, 60, 45, 95].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 1, delay: i * 0.05 }}
                                className={`flex-1 rounded-t-lg bg-gradient-to-t ${i === 11 ? 'from-cisco-blue to-cyan-400 shadow-[0_0_20px_rgba(4,159,217,0.3)]' : 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="mt-8 grid grid-cols-3 border-t border-slate-100 dark:border-white/5 pt-8">
                        <div className="text-center border-r border-slate-100 dark:border-white/5">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">12.4k</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page Views</p>
                        </div>
                        <div className="text-center border-r border-slate-100 dark:border-white/5">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">4.2m</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lab Minutes</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">84%</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Rate</p>
                        </div>
                    </div>
                </div>

                {/* Management List */}
                <div className="glass-card border-white/40">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Recent Users</h3>
                        <button className="text-cisco-blue hover:text-indigo-600 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {RECENT_USERS.map((user, i) => (
                            <div key={user.email} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 border border-slate-200 dark:border-white/5">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate tracking-wide uppercase">{user.email}</p>
                                </div>
                                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${user.status === 'Active' ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                                    }`}>
                                    {user.status}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-10 py-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-xs font-black text-slate-400 uppercase tracking-widest hover:border-cisco-blue hover:text-cisco-blue transition-all">
                        Manage All Users
                    </button>
                </div>

            </div>

            {/* Maintenance / Security Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-10 bg-slate-900 text-white relative overflow-hidden group border-none">
                    <Globe className="absolute -top-10 -right-10 w-48 h-48 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
                    <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                        <Shield className="w-6 h-6 text-emerald-400" />
                        Firewall Insight
                    </h3>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                        Intrusion prevention system is operating at peak capacity. Global traffic patterns show no anomalies in the last 24 hours.
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Network Secured</span>
                    </div>
                </div>

                <div className="glass-card p-10 bg-indigo-600 text-white relative overflow-hidden group border-none">
                    <Zap className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
                    <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-amber-400" />
                        Performance Boost
                    </h3>
                    <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
                        Your server farm is utilizing 42% resources. Consider deploying the new Lab clusters to the European region to reduce latency.
                    </p>
                    <button className="bg-white text-indigo-600 py-3 px-8 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">
                        Optimize Cluster
                    </button>
                </div>
            </div>
        </div>
    );
}

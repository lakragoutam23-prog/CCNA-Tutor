'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    ChevronDown,
    CheckCircle2,
    Lock,
    Clock,
    Target,
    Zap,
    ArrowRight,
    ShieldCheck,
    Globe,
    Terminal,
    Layers,
    Sparkles,
    Settings,
    Cpu,
    Wifi,
    Cloud,
    Code
} from 'lucide-react';

// Complete CCNA 200-301 Curriculum Structure
const CCNA_CURRICULUM = [
    {
        id: 'network-fundamentals',
        name: 'Network Fundamentals',
        icon: Globe,
        weight: 20,
        description: 'Understand networking basics including the OSI model, TCP/IP, and addressing',
        subtopics: [
            { id: 'osi-model', name: 'OSI Model Layers', difficulty: 'beginner', minutes: 15 },
            { id: 'tcp-ip-model', name: 'TCP/IP Model', difficulty: 'beginner', minutes: 12 },
            { id: 'binary-hex-conversion', name: 'Binary & Hexadecimal Conversion', difficulty: 'beginner', minutes: 15 },
            { id: 'network-devices', name: 'Network Device Components', difficulty: 'beginner', minutes: 12 },
            { id: 'ipv4-addressing', name: 'IPv4 Addressing', difficulty: 'beginner', minutes: 20 },
            { id: 'ipv6-addressing', name: 'IPv6 Addressing', difficulty: 'intermediate', minutes: 25 },
            { id: 'classful-classless', name: 'Classful vs Classless Addressing', difficulty: 'beginner', minutes: 15 },
            { id: 'subnetting', name: 'Subnetting Basics (FLSM)', difficulty: 'intermediate', minutes: 30 },
            { id: 'vlsm-cidr', name: 'VLSM & CIDR', difficulty: 'intermediate', minutes: 25 },
            { id: 'network-cables', name: 'Network Cables & Connectors', difficulty: 'beginner', minutes: 10 },
            { id: 'network-topologies', name: 'Network Topologies', difficulty: 'beginner', minutes: 12 },
            { id: 'tcp-vs-udp', name: 'TCP vs UDP', difficulty: 'beginner', minutes: 15 },
            { id: 'arp-icmp', name: 'ARP & ICMP Protocols', difficulty: 'beginner', minutes: 12 },
        ],
    },
    {
        id: 'network-access',
        name: 'Network Access',
        icon: Terminal,
        weight: 20,
        description: 'Configure and troubleshoot VLANs, STP, EtherChannel, and wireless',
        subtopics: [
            { id: 'vlan-basics', name: 'VLAN Basics', difficulty: 'beginner', minutes: 15 },
            { id: 'vlan-trunking', name: 'VLAN Trunking (802.1Q)', difficulty: 'intermediate', minutes: 20 },
            { id: 'dtp-vtp', name: 'DTP & VTP', difficulty: 'intermediate', minutes: 18 },
            { id: 'stp-basics', name: 'Spanning Tree Protocol (STP)', difficulty: 'intermediate', minutes: 25 },
            { id: 'rstp-pvst', name: 'Rapid STP & PVST+', difficulty: 'advanced', minutes: 20 },
            { id: 'etherchannel', name: 'EtherChannel (LACP/PAgP)', difficulty: 'intermediate', minutes: 22 },
            { id: 'wireless-fundamentals', name: 'Wireless Fundamentals', difficulty: 'beginner', minutes: 15 },
            { id: 'wlc-architecture', name: 'WLC & AP Architecture', difficulty: 'intermediate', minutes: 18 },
        ],
    },
    {
        id: 'ip-connectivity',
        name: 'IP Connectivity',
        icon: Layers,
        weight: 25,
        description: 'Configure routing protocols and understand path selection',
        subtopics: [
            { id: 'routing-fundamentals', name: 'Routing Fundamentals', difficulty: 'beginner', minutes: 15 },
            { id: 'routing-table', name: 'Routing Table & Path Selection', difficulty: 'beginner', minutes: 12 },
            { id: 'static-routing', name: 'Static Routing', difficulty: 'beginner', minutes: 18 },
            { id: 'default-floating-routes', name: 'Default & Floating Routes', difficulty: 'intermediate', minutes: 15 },
            { id: 'inter-vlan-routing', name: 'Inter-VLAN Routing (Router-on-a-Stick)', difficulty: 'intermediate', minutes: 22 },
            { id: 'layer3-switching', name: 'Layer 3 Switching & SVIs', difficulty: 'intermediate', minutes: 18 },
            { id: 'ospf-single-area', name: 'OSPF Single Area', difficulty: 'intermediate', minutes: 30 },
            { id: 'ospf-multi-area', name: 'OSPF Multi-Area', difficulty: 'advanced', minutes: 25 },
            { id: 'ospf-neighbor-states', name: 'OSPF Neighbor States & DR/BDR', difficulty: 'advanced', minutes: 20 },
            { id: 'administrative-distance', name: 'Administrative Distance', difficulty: 'intermediate', minutes: 12 },
            { id: 'hsrp-fhrp', name: 'First Hop Redundancy (HSRP/VRRP)', difficulty: 'intermediate', minutes: 20 },
            { id: 'ipv6-routing', name: 'IPv6 Routing', difficulty: 'intermediate', minutes: 22 },
        ],
    },
    {
        id: 'ip-services',
        name: 'IP Services',
        icon: Settings,
        weight: 10,
        description: 'Configure DHCP, NAT, NTP, and network management protocols',
        subtopics: [
            { id: 'dhcp-config', name: 'DHCP Configuration', difficulty: 'beginner', minutes: 18 },
            { id: 'dhcp-relay', name: 'DHCP Relay Agent (ip helper-address)', difficulty: 'intermediate', minutes: 15 },
            { id: 'dns-basics', name: 'DNS Basics', difficulty: 'beginner', minutes: 12 },
            { id: 'nat-types', name: 'NAT (Static, Dynamic, PAT)', difficulty: 'intermediate', minutes: 25 },
            { id: 'ntp-config', name: 'NTP Configuration', difficulty: 'beginner', minutes: 10 },
            { id: 'cdp-lldp', name: 'CDP & LLDP Discovery Protocols', difficulty: 'beginner', minutes: 12 },
            { id: 'tftp-ftp', name: 'TFTP/FTP for IOS Management', difficulty: 'intermediate', minutes: 15 },
            { id: 'snmp-syslog', name: 'SNMP & Syslog', difficulty: 'intermediate', minutes: 18 },
            { id: 'qos-concepts', name: 'QoS Concepts', difficulty: 'intermediate', minutes: 15 },
            { id: 'ssh-config', name: 'SSH Configuration', difficulty: 'beginner', minutes: 12 },
        ],
    },
    {
        id: 'security-fundamentals',
        name: 'Security Fundamentals',
        icon: ShieldCheck,
        weight: 15,
        description: 'Implement network security using ACLs, VPNs, and device hardening',
        subtopics: [
            { id: 'security-concepts', name: 'Security Concepts & Threats', difficulty: 'beginner', minutes: 15 },
            { id: 'device-access-control', name: 'Device Access Control (Console/VTY)', difficulty: 'beginner', minutes: 12 },
            { id: 'password-recovery', name: 'Password Recovery Procedures', difficulty: 'intermediate', minutes: 15 },
            { id: 'standard-acls', name: 'Standard ACLs', difficulty: 'beginner', minutes: 18 },
            { id: 'extended-acls', name: 'Extended ACLs', difficulty: 'intermediate', minutes: 22 },
            { id: 'port-security', name: 'Port Security', difficulty: 'intermediate', minutes: 15 },
            { id: 'dhcp-snooping', name: 'DHCP Snooping', difficulty: 'intermediate', minutes: 15 },
            { id: 'dai', name: 'Dynamic ARP Inspection (DAI)', difficulty: 'intermediate', minutes: 15 },
            { id: 'aaa-concepts', name: 'AAA Concepts', difficulty: 'intermediate', minutes: 18 },
            { id: 'vpn-types', name: 'VPN Types (Site-to-Site, Remote Access)', difficulty: 'intermediate', minutes: 15 },
            { id: 'wireless-security', name: 'Wireless Security (WPA2/WPA3)', difficulty: 'intermediate', minutes: 15 },
            { id: 'firewall-concepts', name: 'Firewall Concepts', difficulty: 'beginner', minutes: 12 },
        ],
    },
    {
        id: 'automation-programmability',
        name: 'Automation & Programmability',
        icon: Code,
        weight: 10,
        description: 'Understand network automation, APIs, and configuration management',
        subtopics: [
            { id: 'rest-apis', name: 'REST APIs', difficulty: 'intermediate', minutes: 18 },
            { id: 'json-xml', name: 'JSON & XML Data Formats', difficulty: 'beginner', minutes: 12 },
            { id: 'cisco-dna-center', name: 'Cisco DNA Center', difficulty: 'intermediate', minutes: 20 },
            { id: 'ansible-basics', name: 'Ansible Basics', difficulty: 'intermediate', minutes: 18 },
            { id: 'python-networking', name: 'Python for Networking', difficulty: 'intermediate', minutes: 22 },
            { id: 'controller-networking', name: 'Controller-Based Networking', difficulty: 'intermediate', minutes: 15 },
        ],
    },
];

export default function TopicsPage() {
    const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

    const totalSubtopics = CCNA_CURRICULUM.reduce((sum, domain) => sum + domain.subtopics.length, 0);

    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-cisco-blue/10 text-cisco-blue">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Official Blueprint</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        Course <span className="text-cisco-blue">Curriculum</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                        Follow the structured path to certification. Each domain represents a critical piece of the CCNA 200-301 exam.
                    </p>
                </div>

                <div className="glass-card flex items-center gap-6 py-4 px-8 border-white/40 shadow-sm">
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-900 dark:text-white">Start</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Journey</p>
                    </div>
                    <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10" />
                    <div className="text-center">
                        <p className="text-2xl font-black text-emerald-500">{totalSubtopics}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Modules</p>
                    </div>
                </div>
            </div>

            {/* Overall Progress Viz (Static for now, implies start) */}
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '5%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cisco-blue via-cyan-400 to-indigo-500 rounded-full shadow-[0_0_20px_rgba(4,159,217,0.3)]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shine pointer-events-none" />
            </div>

            {/* Domains List */}
            <div className="grid gap-6">
                {CCNA_CURRICULUM.map((domain, index) => {
                    const isExpanded = expandedDomain === domain.id;
                    // Mock progress removed, default to 0 to look clean for generic user
                    const progress = 0;

                    return (
                        <div key={domain.id} className="group">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`glass-card border-white/40 transition-all duration-300 ${isExpanded ? 'ring-2 ring-cisco-blue/20' : ''}`}
                            >
                                {/* Domain Header */}
                                <button
                                    onClick={() => setExpandedDomain(isExpanded ? null : domain.id)}
                                    className="w-full text-left focus:outline-none"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Icon & Number */}
                                        <div className="flex-shrink-0 w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden group-hover:bg-cisco-blue/5 transition-colors">
                                            <domain.icon className="w-8 h-8 text-slate-400 group-hover:text-cisco-blue transition-colors relative z-10" />
                                            <span className="absolute -bottom-2 -right-2 text-4xl font-black text-slate-100 dark:text-slate-800 pointer-events-none">{index + 1}</span>
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{domain.name}</h2>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 border border-slate-200 dark:border-white/10 rounded-md">Weight: {domain.weight}%</span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{domain.description}</p>
                                        </div>

                                        <div className="flex items-center gap-8 mr-4">
                                            <div className="flex flex-col items-end w-32">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-slate-900 dark:text-white">{progress}%</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mastered</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full mt-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        className="h-full bg-cisco-blue rounded-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded-full border border-slate-200 dark:border-white/10 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-50 dark:bg-white/5' : ''}`}>
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-10 mt-6 border-t border-slate-100 dark:border-white/5 grid gap-4">
                                                {domain.subtopics.map((topic, subIndex) => {
                                                    // Remove mock lock/done state for generic view
                                                    const isDone = false;
                                                    const isLocked = false;

                                                    return (
                                                        <motion.div
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: subIndex * 0.05 }}
                                                            key={topic.id}
                                                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-white/2 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all group/item"
                                                        >
                                                            <div className="flex items-center gap-6">
                                                                <div className={`flex-shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all border-slate-300 dark:border-white/20 text-transparent`}>
                                                                    {/* No icon for incomplete */}
                                                                </div>

                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-[10px] font-black text-cisco-blue">{index + 1}.{subIndex + 1}</span>
                                                                        <h3 className={`font-bold transition-colors text-slate-900 dark:text-white group-hover/item:text-cisco-blue`}>
                                                                            {topic.name}
                                                                        </h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" /> {topic.minutes}m Focus
                                                                        </span>
                                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${topic.difficulty === 'advanced' ? 'text-rose-500 bg-rose-500/10' :
                                                                                topic.difficulty === 'intermediate' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'
                                                                            }`}>
                                                                            {topic.difficulty}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                <Link
                                                                    href={`/learn/topics/${domain.id}/${topic.id}`}
                                                                    className={`flex items-center gap-2 px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest border bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10 dark:shadow-white/5`}
                                                                >
                                                                    Start Module <ArrowRight className="w-3 h-3" />
                                                                </Link>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Tip Card */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl"
            >
                <Sparkles className="absolute -top-10 -right-10 w-48 h-48 opacity-10 rotate-12" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="w-20 h-20 bg-cisco-blue/20 rounded-3xl flex items-center justify-center text-cisco-blue shadow-inner border border-white/5">
                        <Target className="w-10 h-10" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="text-2xl font-black">Strategic Preparation</h3>
                        <p className="text-slate-400 text-sm max-w-xl">
                            Network Connectivity and Network Access make up 45% of the total exam weight. Focus heavily on these areas.
                        </p>
                    </div>
                    <Link href="/learn/quiz/23" className="btn-premium px-10 py-4 text-xs">Access Exam Simulator</Link>
                </div>
            </motion.div>
        </div>
    );
}

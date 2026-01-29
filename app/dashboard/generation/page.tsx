'use client';

import { useState, useEffect } from 'react';

interface GenerationJob {
    id: string;
    topics: string[];
    status: string;
    progress: number;
    model?: string;
    createdAt: string;
    completedAt?: string;
    error?: string;
}

const CCNA_TOPICS = [
    'Network Fundamentals - OSI Model',
    'Network Fundamentals - TCP/IP Model',
    'Network Fundamentals - Ethernet',
    'Network Access - VLANs',
    'Network Access - STP',
    'Network Access - EtherChannel',
    'IP Connectivity - IPv4 Addressing',
    'IP Connectivity - IPv6 Addressing',
    'IP Connectivity - Subnetting',
    'IP Connectivity - Static Routing',
    'IP Connectivity - OSPF',
    'IP Connectivity - EIGRP',
    'IP Services - DHCP',
    'IP Services - DNS',
    'IP Services - NAT',
    'IP Services - NTP',
    'Security - ACLs',
    'Security - Port Security',
    'Security - VPN',
    'Automation - APIs',
    'Automation - JSON/Python',
];

export default function GenerationPage() {
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [model, setModel] = useState('llama-3.1-8b-instant');
    const [temperature, setTemperature] = useState(0.3);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jobs, setJobs] = useState<GenerationJob[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = async () => {
        try {
            const res = await fetch('/api/admin/generate');
            const data = await res.json();
            if (data.success) {
                setJobs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        // Poll for updates every 5 seconds if there are running jobs
        const interval = setInterval(() => {
            if (jobs.some(j => j.status === 'running')) {
                fetchJobs();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [jobs]);

    const toggleTopic = (topic: string) => {
        setSelectedTopics(prev =>
            prev.includes(topic)
                ? prev.filter(t => t !== topic)
                : [...prev, topic]
        );
    };

    const estimatedTokens = selectedTopics.length * 2000;

    const handleSubmit = async () => {
        if (selectedTopics.length === 0) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topics: selectedTopics,
                    model,
                    temperature,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSelectedTopics([]);
                fetchJobs();
            } else {
                alert(data.error || 'Failed to start generation');
            }
        } catch (error) {
            alert('Failed to start generation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'badge-success';
            case 'running': return 'badge-primary';
            case 'failed': return 'badge-destructive';
            case 'completed_with_errors': return 'badge-warning';
            default: return 'badge-secondary';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">LLM Generation</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Generate knowledge nodes using AI (Groq Enhanced)
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Topic Selection */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="card">
                        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                            <h2 className="font-semibold">Select Topics</h2>
                            <span className="text-sm text-gray-500">{selectedTopics.length} selected</span>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                                {CCNA_TOPICS.map((topic) => (
                                    <button
                                        key={topic}
                                        onClick={() => toggleTopic(topic)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedTopics.includes(topic)
                                            ? 'bg-cisco-blue text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 flex gap-2">
                            <button
                                onClick={() => setSelectedTopics(CCNA_TOPICS)}
                                className="btn-outline btn-sm"
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => setSelectedTopics([])}
                                className="btn-outline btn-sm"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Recent Jobs */}
                    <div className="card">
                        <div className="p-4 border-b dark:border-gray-700">
                            <h2 className="font-semibold">Generation Jobs</h2>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin h-6 w-6 border-2 border-cisco-blue border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No generation jobs yet. Select topics and generate!
                            </div>
                        ) : (
                            <div className="divide-y dark:divide-gray-700">
                                {jobs.map((job) => (
                                    <div key={job.id} className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">
                                                {job.topics.slice(0, 3).join(', ')}
                                                {job.topics.length > 3 ? ` +${job.topics.length - 3} more` : ''}
                                            </span>
                                            <span className={`badge ${getStatusColor(job.status)}`}>
                                                {job.status}
                                            </span>
                                        </div>
                                        {job.status === 'running' && (
                                            <div className="progress-bar mb-2">
                                                <div className="progress-bar-fill" style={{ width: `${job.progress}%` }} />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>{new Date(job.createdAt).toLocaleString()}</span>
                                            <span>{job.topics.length} topics</span>
                                        </div>
                                        {job.error && (
                                            <div className="mt-2 text-sm text-red-500">
                                                Error: {job.error}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Config Panel */}
                <div className="space-y-4">
                    <div className="card p-4 space-y-4">
                        <h2 className="font-semibold">Configuration</h2>

                        <div>
                            <label className="label block mb-1">Model (Groq)</label>
                            <select
                                className="input w-full"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                            >
                                <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</option>
                                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Creative)</option>
                            </select>
                        </div>

                        <div>
                            <label className="label block mb-1">Temperature: {temperature}</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Precise</span>
                                <span>Creative</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4 space-y-3">
                        <h2 className="font-semibold">Cost Estimate</h2>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Topics</span>
                            <span>{selectedTopics.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Est. Tokens</span>
                            <span>~{estimatedTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium border-t dark:border-gray-700 pt-3">
                            <span>Estimated Cost</span>
                            <span className="text-green-600">$0.00 (Groq Free)</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={selectedTopics.length === 0 || isSubmitting}
                        className="btn-primary w-full"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Starting...
                            </span>
                        ) : (
                            `Generate ${selectedTopics.length} Topic${selectedTopics.length !== 1 ? 's' : ''}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

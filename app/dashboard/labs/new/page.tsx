'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewLabPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [lab, setLab] = useState({
        title: '',
        description: '',
        topic: '',
        difficulty: 'intermediate' as const,
        estimatedMinutes: 30,
        objectives: [''],
        initialConfig: '',
        solutionConfig: '',
        hints: [''],
    });

    const addObjective = () => {
        setLab(l => ({ ...l, objectives: [...l.objectives, ''] }));
    };

    const updateObjective = (index: number, value: string) => {
        setLab(l => ({
            ...l,
            objectives: l.objectives.map((o, i) => i === index ? value : o),
        }));
    };

    const removeObjective = (index: number) => {
        if (lab.objectives.length > 1) {
            setLab(l => ({ ...l, objectives: l.objectives.filter((_, i) => i !== index) }));
        }
    };

    const addHint = () => {
        setLab(l => ({ ...l, hints: [...l.hints, ''] }));
    };

    const updateHint = (index: number, value: string) => {
        setLab(l => ({
            ...l,
            hints: l.hints.map((h, i) => i === index ? value : h),
        }));
    };

    const handleSubmit = async () => {
        setError('');

        if (!lab.title.trim()) {
            setError('Lab title is required');
            return;
        }
        if (!lab.description.trim()) {
            setError('Lab description is required');
            return;
        }
        if (!lab.topic.trim()) {
            setError('Topic is required');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/labs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...lab,
                    objectives: lab.objectives.filter(o => o.trim()),
                    hints: lab.hints.filter(h => h.trim()),
                }),
            });

            const data = await res.json();
            if (data.success) {
                router.push('/dashboard/labs');
            } else {
                setError(data.error || 'Failed to create lab');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Create New Lab</h1>
                    <p className="text-gray-600 dark:text-gray-400">Build a hands-on lab exercise</p>
                </div>
                <Link href="/dashboard/labs" className="btn-outline">Cancel</Link>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            <div className="card p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                        type="text"
                        className="input w-full"
                        placeholder="e.g., Configure OSPF Single Area"
                        value={lab.title}
                        onChange={(e) => setLab(l => ({ ...l, title: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description *</label>
                    <textarea
                        className="input w-full h-24"
                        placeholder="Describe what the student will learn and do..."
                        value={lab.description}
                        onChange={(e) => setLab(l => ({ ...l, description: e.target.value }))}
                    />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Topic *</label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="e.g., OSPF"
                            value={lab.topic}
                            onChange={(e) => setLab(l => ({ ...l, topic: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Difficulty</label>
                        <select
                            className="input w-full"
                            value={lab.difficulty}
                            onChange={(e) => setLab(l => ({ ...l, difficulty: e.target.value as any }))}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Est. Minutes</label>
                        <input
                            type="number"
                            className="input w-full"
                            value={lab.estimatedMinutes}
                            onChange={(e) => setLab(l => ({ ...l, estimatedMinutes: parseInt(e.target.value) || 30 }))}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium">Learning Objectives</label>
                        <button type="button" className="text-sm text-cisco-blue" onClick={addObjective}>+ Add</button>
                    </div>
                    <div className="space-y-2">
                        {lab.objectives.map((obj, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    type="text"
                                    className="input flex-1"
                                    placeholder={`Objective ${i + 1}`}
                                    value={obj}
                                    onChange={(e) => updateObjective(i, e.target.value)}
                                />
                                {lab.objectives.length > 1 && (
                                    <button onClick={() => removeObjective(i)} className="text-red-500">×</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Initial Configuration (optional)</label>
                    <textarea
                        className="input w-full h-32 font-mono text-sm"
                        placeholder="Router(config)# ..."
                        value={lab.initialConfig}
                        onChange={(e) => setLab(l => ({ ...l, initialConfig: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Solution Configuration (optional)</label>
                    <textarea
                        className="input w-full h-32 font-mono text-sm"
                        placeholder="The correct configuration..."
                        value={lab.solutionConfig}
                        onChange={(e) => setLab(l => ({ ...l, solutionConfig: e.target.value }))}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium">Hints</label>
                        <button type="button" className="text-sm text-cisco-blue" onClick={addHint}>+ Add</button>
                    </div>
                    <div className="space-y-2">
                        {lab.hints.map((hint, i) => (
                            <input
                                key={i}
                                type="text"
                                className="input w-full"
                                placeholder={`Hint ${i + 1}`}
                                value={hint}
                                onChange={(e) => updateHint(i, e.target.value)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Link href="/dashboard/labs" className="btn-outline">Cancel</Link>
                <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Creating...' : 'Create Lab'}
                </button>
            </div>
        </div>
    );
}

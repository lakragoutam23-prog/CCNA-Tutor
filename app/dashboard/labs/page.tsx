'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lab {
    id: string;
    title: string;
    description: string;
    topic: string;
    difficulty: string;
    estimatedMinutes: number;
    status: 'draft' | 'published';
    createdAt: string;
}

export default function LabsPage() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLabs = async () => {
        try {
            const res = await fetch('/api/admin/labs');
            const data = await res.json();
            if (data.success) {
                setLabs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch labs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabs();
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/labs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                fetchLabs();
            }
        } catch (error) {
            console.error('Status update failed:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lab?')) return;

        try {
            const res = await fetch(`/api/admin/labs?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchLabs();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Labs</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage hands-on lab exercises</p>
                </div>
                <Link href="/dashboard/labs/new" className="btn-primary">
                    + Create Lab
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-cisco-blue border-t-transparent rounded-full" />
                </div>
            ) : labs.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-5xl mb-4">💻</div>
                    <h2 className="text-xl font-semibold mb-2">No labs yet</h2>
                    <p className="text-gray-500 mb-4">Create your first lab exercise</p>
                    <Link href="/dashboard/labs/new" className="btn-primary">
                        Create Lab
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {labs.map(lab => (
                        <div key={lab.id} className="card p-5 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg">{lab.title}</h3>
                                <button
                                    onClick={() => handleStatusChange(lab.id, lab.status === 'published' ? 'draft' : 'published')}
                                    className={`text-xs px-2 py-1 rounded-full ${lab.status === 'published'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {lab.status}
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{lab.description}</p>

                            <div className="flex items-center gap-2 mb-2">
                                <span className="badge-secondary text-xs">{lab.topic}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                <span>{lab.estimatedMinutes} min</span>
                                <span className="capitalize">{lab.difficulty}</span>
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t dark:border-gray-700">
                                <button
                                    onClick={() => handleDelete(lab.id)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

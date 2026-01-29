'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface KnowledgeNode {
    id: string;
    topic: string;
    subtopic: string | null;
    intent: string;
    estimatedMinutes: number;
    difficulty: string;
}

export default function KnowledgeHub() {
    const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKnowledge = async () => {
            try {
                const response = await fetch('/api/knowledge?module=ccna');
                const data = await response.json();
                if (data.success) {
                    setNodes(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch knowledge:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchKnowledge();
    }, []);

    // Group by topic
    const groupedNodes = nodes.reduce((acc, node) => {
        const topic = node.topic;
        if (!acc[topic]) {
            acc[topic] = [];
        }
        acc[topic].push(node);
        return acc;
    }, {} as Record<string, KnowledgeNode[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Knowledge Hub</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Explore comprehensive study materials for your CCNA journey
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card p-6 animate-pulse h-40" />
                    ))}
                </div>
            ) : Object.keys(groupedNodes).length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-4xl mb-4">📚</div>
                    <h2 className="text-xl font-semibold mb-2">No content available</h2>
                    <p className="text-gray-500">Knowledge base is being built. Check back soon!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {Object.entries(groupedNodes).map(([topic, topicNodes]) => (
                        <div key={topic} className="card p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-cisco-blue rounded-full"></span>
                                {topic}
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {topicNodes.map(node => (
                                    <Link
                                        key={node.id}
                                        href={`/learn/knowledge/${node.id}`}
                                        className="block p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-cisco-blue dark:hover:border-cisco-blue hover:shadow-md transition-all group bg-gray-50 dark:bg-gray-800/50"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${node.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                                    node.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {node.difficulty}
                                            </span>
                                            <span className="text-xs text-gray-500">{node.estimatedMinutes} min</span>
                                        </div>
                                        <h3 className="font-medium mb-1 group-hover:text-cisco-blue transition-colors">
                                            {node.intent.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </h3>
                                        {node.subtopic && (
                                            <p className="text-sm text-gray-500">{node.subtopic}</p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

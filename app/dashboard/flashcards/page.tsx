'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Flashcard {
    id: string;
    front: string;
    back: string;
    topic: string;
    difficulty: string;
    status: string;
    createdAt: string;
}

const TOPICS = [
    'Network Fundamentals',
    'Network Access',
    'IP Connectivity',
    'IP Services',
    'Security Fundamentals',
    'Automation',
];

export default function AdminFlashcardsPage() {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editCard, setEditCard] = useState<Flashcard | null>(null);
    const [formData, setFormData] = useState({
        front: '',
        back: '',
        topic: 'Network Fundamentals',
        difficulty: 'intermediate',
        status: 'draft',
    });

    const fetchCards = async () => {
        try {
            const res = await fetch('/api/admin/flashcards');
            const data = await res.json();
            if (data.success) {
                setCards(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch flashcards:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/admin/flashcards', {
                method: editCard ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editCard ? { id: editCard.id, ...formData } : formData),
            });

            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                setEditCard(null);
                setFormData({ front: '', back: '', topic: 'Network Fundamentals', difficulty: 'intermediate', status: 'draft' });
                fetchCards();
            } else {
                alert(data.error || 'Failed to save');
            }
        } catch (error) {
            alert('Failed to save flashcard');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this flashcard?')) return;

        try {
            const res = await fetch(`/api/admin/flashcards?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchCards();
            }
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const handleToggleStatus = async (card: Flashcard) => {
        const newStatus = card.status === 'published' ? 'draft' : 'published';
        try {
            const res = await fetch('/api/admin/flashcards', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: card.id, status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchCards();
            }
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const openEditModal = (card: Flashcard) => {
        setEditCard(card);
        setFormData({
            front: card.front,
            back: card.back,
            topic: card.topic,
            difficulty: card.difficulty,
            status: card.status,
        });
        setShowModal(true);
    };

    const openNewModal = () => {
        setEditCard(null);
        setFormData({ front: '', back: '', topic: 'Network Fundamentals', difficulty: 'intermediate', status: 'draft' });
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-cisco-blue border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Flashcards</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage study flashcards</p>
                </div>
                <button onClick={openNewModal} className="btn-primary">
                    + Create Flashcard
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                    <div className="text-2xl font-bold">{cards.length}</div>
                    <div className="text-sm text-gray-500">Total Cards</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {cards.filter(c => c.status === 'published').length}
                    </div>
                    <div className="text-sm text-gray-500">Published</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                        {cards.filter(c => c.status === 'draft').length}
                    </div>
                    <div className="text-sm text-gray-500">Drafts</div>
                </div>
            </div>

            {/* Cards List */}
            {cards.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-5xl mb-4">🎴</div>
                    <h2 className="text-xl font-semibold mb-2">No flashcards yet</h2>
                    <p className="text-gray-500 mb-4">Create your first flashcard to get started</p>
                    <button onClick={openNewModal} className="btn-primary">
                        Create Flashcard
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map(card => (
                        <div key={card.id} className="card p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <span className={`badge ${card.status === 'published' ? 'badge-success' : 'badge-secondary'}`}>
                                    {card.status}
                                </span>
                                <span className="text-xs text-gray-400">{card.difficulty}</span>
                            </div>
                            <div>
                                <div className="font-medium mb-1">Front:</div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{card.front}</p>
                            </div>
                            <div>
                                <div className="font-medium mb-1">Back:</div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{card.back}</p>
                            </div>
                            <div className="text-xs text-gray-500">Topic: {card.topic}</div>
                            <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                                <button
                                    onClick={() => handleToggleStatus(card)}
                                    className="btn-outline btn-sm flex-1"
                                >
                                    {card.status === 'published' ? 'Unpublish' : 'Publish'}
                                </button>
                                <button onClick={() => openEditModal(card)} className="btn-outline btn-sm">
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(card.id)} className="btn-outline btn-sm text-red-600">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editCard ? 'Edit Flashcard' : 'Create Flashcard'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Front (Question)</label>
                                <textarea
                                    className="input w-full"
                                    rows={3}
                                    value={formData.front}
                                    onChange={e => setFormData(f => ({ ...f, front: e.target.value }))}
                                    placeholder="What is displayed on the front of the card?"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Back (Answer)</label>
                                <textarea
                                    className="input w-full"
                                    rows={4}
                                    value={formData.back}
                                    onChange={e => setFormData(f => ({ ...f, back: e.target.value }))}
                                    placeholder="The answer or explanation"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Topic</label>
                                    <select
                                        className="input w-full"
                                        value={formData.topic}
                                        onChange={e => setFormData(f => ({ ...f, topic: e.target.value }))}
                                    >
                                        {TOPICS.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Difficulty</label>
                                    <select
                                        className="input w-full"
                                        value={formData.difficulty}
                                        onChange={e => setFormData(f => ({ ...f, difficulty: e.target.value }))}
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="label">Status</label>
                                <select
                                    className="input w-full"
                                    value={formData.status}
                                    onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    {editCard ? 'Save Changes' : 'Create Card'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

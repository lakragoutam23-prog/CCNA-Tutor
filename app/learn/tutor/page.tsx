'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    source?: 'cache' | 'database' | 'llm';
    latency?: number;
}

export default function TutorPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'learn' | 'exam'>('learn');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/runtime/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage.content,
                    module: 'ccna',
                    mode,
                }),
            });

            const data = await response.json();

            if (data.success) {
                const tutorResponse = data.data;
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: formatResponse(tutorResponse),
                    source: tutorResponse.source,
                    latency: tutorResponse.latency,
                };
                setMessages((prev) => [...prev, assistantMessage]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `Sorry, I encountered an error: ${data.error}`,
                    },
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Sorry, there was a network error. Please try again.',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatResponse = (response: any) => {
        let formatted = `## ${response.topic}\n\n`;
        formatted += `${response.explanation.concept}\n\n`;

        if (response.explanation.mentalModel) {
            formatted += `### 🧠 Mental Model\n${response.explanation.mentalModel}\n\n`;
        }

        if (response.explanation.wireLogic) {
            formatted += `### 📡 How It Works\n${response.explanation.wireLogic}\n\n`;
        }

        if (response.explanation.cliExample) {
            formatted += `### 💻 CLI Example\n\`\`\`\n${response.explanation.cliExample}\n\`\`\`\n\n`;
        }

        if (response.commonMistakes?.length > 0) {
            formatted += `### ⚠️ Common Mistakes\n${response.commonMistakes.map((m: string) => `• ${m}`).join('\n')}\n\n`;
        }

        if (response.examNote) {
            formatted += `### 📝 Exam Tip\n${response.examNote}`;
        }

        return formatted;
    };

    const suggestedQuestions = [
        'What is a VLAN and why use it?',
        'How does OSPF calculate the best path?',
        'What is the difference between TCP and UDP?',
        'How does NAT work?',
        'Explain STP and why we need it',
    ];

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">AI Tutor</h1>
                    <p className="text-gray-600 dark:text-gray-400">Ask me anything about CCNA topics</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Mode:</span>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as 'learn' | 'exam')}
                        className="input py-1 px-3"
                    >
                        <option value="learn">📚 Learn</option>
                        <option value="exam">📝 Exam</option>
                    </select>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 card overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🤖</div>
                            <h2 className="text-xl font-semibold mb-2">How can I help you?</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Ask me about any CCNA networking concept
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {suggestedQuestions.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="btn-outline text-sm"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-xl p-4 ${message.role === 'user'
                                            ? 'bg-cisco-blue text-white'
                                            : 'bg-gray-100 dark:bg-gray-800'
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                    {message.source && (
                                        <div className="mt-2 text-xs opacity-70 flex items-center gap-2">
                                            <span className={`badge ${message.source === 'cache' ? 'badge-success' :
                                                    message.source === 'database' ? 'badge-primary' : 'badge-warning'
                                                }`}>
                                                {message.source}
                                            </span>
                                            {message.latency && <span>{message.latency}ms</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-cisco-blue rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-cisco-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 bg-cisco-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about VLANs, OSPF, subnetting..."
                            className="input flex-1"
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-6">
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Sparkles,
    BrainCircuit,
    Lightbulb,
    MessageSquare,
    Mic,
    MicOff,
    Volume2,
    Settings,
    MoreHorizontal,
    Plus,
    ArrowRight,
    ShieldCheck,
    Globe,
    Loader2
} from 'lucide-react';
import MarkdownMessage from '@/components/MarkdownMessage';

const SUGGESTED_QUESTIONS = [
    { text: "Explain OSPF Area Types", icon: <Globe className="w-4 h-4" /> },
    { text: "How to configure a VLAN?", icon: <Settings className="w-4 h-4" /> },
    { text: "What is IPv6 Subnetting?", icon: <Plus className="w-4 h-4" /> },
    { text: "Troubleshoot EtherChannel", icon: <ShieldCheck className="w-4 h-4" /> },
];

export default function TutorPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    const transcript = Array.from(event.results)
                        .map((result: any) => result[0])
                        .map((result: any) => result.transcript)
                        .join('');

                    if (event.results[0].isFinal) {
                        setInput(prev => prev + (prev ? ' ' : '') + transcript);
                        setIsListening(false);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start recognition:", err);
            }
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        const userMessage = { role: 'user', content: text, id: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] })
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.content, id: Date.now() + 1 }]);
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6 relative">

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto pr-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
            >
                <AnimatePresence mode='popLayout'>
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-6"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-cisco-blue to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-cisco-blue/20 mb-10 animate-pulse">
                                <BrainCircuit className="w-12 h-12" />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                                Systems <span className="text-cisco-blue">Online</span>. <br /> How can I assist your study today?
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium italic mb-12 leading-relaxed">
                                I am calibrated to the CCNA 200-301 curriculum. Ask me anything about topology design, configuration, or theory.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                {SUGGESTED_QUESTIONS.map((q, i) => (
                                    <motion.button
                                        key={q.text}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSend(q.text)}
                                        className="glass-card flex items-center justify-between p-5 text-left border-white/40 hover:border-cisco-blue hover:text-cisco-blue transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400">
                                                {q.icon}
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300 group-hover:text-cisco-blue">
                                                {q.text}
                                            </span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="space-y-8 max-w-4xl mx-auto w-full px-4">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-cisco-blue text-white'
                                            }`}>
                                            {msg.role === 'user' ? <MessageSquare className="w-5 h-5" /> : <Sparkles className="w-5 h-5 font-black" />}
                                        </div>

                                        {/* Content */}
                                        <div className={`space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-6 rounded-[2rem] border shadow-sm ${msg.role === 'user'
                                                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-tr-none'
                                                : 'glass border-white/40 dark:border-white/5 text-slate-900 dark:text-white rounded-tl-none prose prose-slate dark:prose-invert max-w-none'
                                                }`}>
                                                {msg.role === 'assistant' ? (
                                                    <MarkdownMessage content={msg.content} />
                                                ) : (
                                                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>
                                                <span>{msg.role === 'user' ? 'Deciphering' : 'AI Intel'}</span>
                                                <span>•</span>
                                                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start items-center gap-4 max-w-4xl mx-auto w-full px-4"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-cisco-blue text-white flex items-center justify-center shadow-lg animate-bounce">
                                        <BrainCircuit className="w-5 h-5" />
                                    </div>
                                    <div className="flex gap-1.5 p-4 pl-0">
                                        <span className="w-2 h-2 rounded-full bg-cisco-blue/40 animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 rounded-full bg-cisco-blue/40 animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 rounded-full bg-cisco-blue/40 animate-bounce"></span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="mt-auto px-4 pb-2">
                <div className="max-w-4xl mx-auto relative">
                    <motion.div
                        layout
                        className="glass p-2 rounded-[2.5rem] border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.1)] relative z-10"
                    >
                        <div className="flex items-center gap-2 pl-4 pr-2">
                            <div className="p-3 text-slate-400 hover:text-cisco-blue transition-colors group cursor-pointer">
                                <Plus className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Describe ACL types or ask for a configuration lab..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white font-medium text-sm placeholder-slate-400 py-4"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleListening}
                                    className={`p-3 transition-colors hidden sm:block rounded-xl ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-cisco-blue'}`}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSend()}
                                    className={`p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center ${input.trim() ? 'bg-cisco-blue text-white shadow-lg shadow-cisco-blue/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                        }`}
                                >
                                    <Send className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Visual Deco Under Input */}
                    <div className="absolute -bottom-1 inset-x-10 h-10 bg-cisco-blue/10 blur-[40px] rounded-full -z-10"></div>
                </div>

                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                    Encrypted End-to-End AI Channel • Verified CCNA Knowledge Base
                </p>
            </div>

        </div>
    );
}

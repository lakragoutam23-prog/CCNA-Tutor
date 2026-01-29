'use client';

import { useState, useRef, useEffect } from 'react';
import type { CLIState, CLICommand } from '@/types';

interface HistoryEntry {
    prompt: string;
    command: CLICommand;
}

export default function LabsPage() {
    const [exercises, setExercises] = useState<any[]>([]);
    const [loadingLabs, setLoadingLabs] = useState(true);

    // Initial state
    const [cliState, setCliState] = useState<CLIState>({
        device: 'router',
        mode: 'user',
        prompt: 'Router>',
        runningConfig: '',
        hostname: 'Router',
        interfaces: {},
    });

    const [commandHistory, setCommandHistory] = useState<HistoryEntry[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Add this effect to fetch labs
    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const response = await fetch('/api/labs');
                const data = await response.json();
                if (data.success) {
                    setExercises(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch labs:', error);
            } finally {
                setLoadingLabs(false);
            }
        };

        fetchLabs();
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [commandHistory, isProcessing]);

    // Focus input on mount and click
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        const commandText = input.trim();
        setIsProcessing(true);
        setInput('');
        setHistoryIndex(-1);

        // Store prompt before execution
        const currentPrompt = cliState.prompt;

        try {
            const res = await fetch('/api/cli', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: commandText,
                    state: cliState,
                }),
            });

            const data = await res.json();

            if (data.success) {
                const newCommand: CLICommand = {
                    device: cliState.device,
                    command: commandText,
                    output: data.response.output,
                    timestamp: new Date(),
                    valid: data.response.valid,
                };

                setCommandHistory(prev => [...prev, { prompt: currentPrompt, command: newCommand }]);
                setCliState(data.newState);
            } else {
                // Handle API error
                const errorCommand: CLICommand = {
                    device: cliState.device,
                    command: commandText,
                    output: `% Connection error: ${data.error}`,
                    timestamp: new Date(),
                    valid: false,
                };
                setCommandHistory(prev => [...prev, { prompt: currentPrompt, command: errorCommand }]);
            }
        } catch (error) {
            const errorCommand: CLICommand = {
                device: cliState.device,
                command: commandText,
                output: '% Network error. Please check your connection.',
                timestamp: new Date(),
                valid: false,
            };
            setCommandHistory(prev => [...prev, { prompt: currentPrompt, command: errorCommand }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isProcessing) return;

        const inputCommands = commandHistory.map(h => h.command.command);

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < inputCommands.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(inputCommands[inputCommands.length - 1 - newIndex] || '');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(inputCommands[inputCommands.length - 1 - newIndex] || '');
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        }
    };

    const handleReset = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/cli');
            const data = await res.json();
            if (data.success) {
                setCliState(data.state);
                setCommandHistory([]);
                setInput('');
            }
        } finally {
            setIsProcessing(false);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Practice Labs</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Practice Cisco IOS commands in a realistic terminal
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">AI-Powered</span>
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Exercises List */}
                <div className="lg:col-span-1 space-y-3">
                    <h2 className="font-semibold">Available Labs</h2>
                    {loadingLabs ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="card p-4 animate-pulse h-24" />
                            ))}
                        </div>
                    ) : exercises.length === 0 ? (
                        <div className="card p-6 text-center text-gray-500">
                            No published labs yet.
                        </div>
                    ) : (
                        exercises.map((ex) => (
                            <div key={ex.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-medium">{ex.title}</h3>
                                    <span className={`text-xs px-2 py-1 rounded ${ex.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                            ex.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{ex.description}</p>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>{ex.topic}</span>
                                    <span>{ex.estimatedMinutes} mins</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* CLI Terminal */}
                <div className="lg:col-span-2">
                    <div className="card overflow-hidden">
                        <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <span className="text-sm text-gray-400">Cisco IOS Simulator (AI-Powered)</span>
                            <button
                                onClick={handleReset}
                                className="text-xs text-gray-400 hover:text-white"
                            >
                                Reset
                            </button>
                        </div>

                        <div
                            ref={terminalRef}
                            className="cli-terminal h-96 overflow-y-auto"
                            onClick={() => !isProcessing && inputRef.current?.focus()}
                        >
                            <div className="text-green-400 mb-2">
                                Cisco IOS Software, CCNA Tutor Simulation
                                <br />Type &apos;?&apos; for help.
                                <br />
                                <br />
                                <span className="text-yellow-400">💡 Tip: This terminal is powered by AI and understands natural Cisco commands!</span>
                            </div>

                            {commandHistory.map((entry, i) => (
                                <div key={i} className="mb-1">
                                    <div>
                                        <span className="cli-prompt">{entry.prompt}</span>
                                        <span className="cli-command">{entry.command.command}</span>
                                    </div>
                                    {entry.command.output && (
                                        <div className={entry.command.valid ? 'cli-output whitespace-pre-wrap' : 'cli-error whitespace-pre-wrap'}>
                                            {entry.command.output}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <form onSubmit={handleSubmit} className="flex">
                                <span className="cli-prompt">{cliState.prompt}</span>
                                {isProcessing ? (
                                    <span className="animate-pulse text-gray-400 ml-1">▋</span>
                                ) : (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1 bg-transparent border-none outline-none text-white font-mono"
                                        autoComplete="off"
                                        spellCheck={false}
                                        autoFocus
                                    />
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Quick Commands */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500">Quick commands:</span>
                        {['enable', 'conf t', 'show run', 'sh ip int br', 'show vlan', '?'].map((cmd) => (
                            <button
                                key={cmd}
                                onClick={() => !isProcessing && setInput(cmd)}
                                disabled={isProcessing}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                {cmd}
                            </button>
                        ))}
                    </div>

                    {/* Mode Indicator */}
                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                        <span>
                            Current mode: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                                {cliState.mode.replace('_', ' ')}
                            </span>
                        </span>
                        {isProcessing && <span className="text-green-600 animate-pulse">Processing...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

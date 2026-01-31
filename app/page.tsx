import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-cisco-dark via-primary-800 to-cisco-dark">
            {/* Navigation */}
            <nav className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <svg className="w-10 h-10 text-cisco-blue" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <span className="text-2xl font-bold text-white">CCNA Tutor</span>
                    </div>
                    <Link href="/login" className="btn-primary">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
                        Master Cisco Networking
                        <span className="block text-cisco-blue mt-2">with AI-Powered Tutoring</span>
                    </h1>
                    <p className="text-xl text-gray-300 mb-10 animate-slide-up">
                        Interactive learning, practice labs, and exam preparation
                        designed to help you pass the CCNA certification.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
                        <Link href="/login" className="btn-primary btn-lg w-full sm:w-auto">
                            Start Learning Free
                        </Link>
                        <Link href="#features" className="btn border border-white text-white bg-transparent hover:bg-white/10 btn-lg w-full sm:w-auto">
                            Explore Features
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
                    {[
                        { label: 'Knowledge Topics', value: '200+' },
                        { label: 'Practice Questions', value: '1000+' },
                        { label: 'Lab Exercises', value: '50+' },
                        { label: 'Success Rate', value: '95%' },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center p-6 rounded-lg bg-white/10 backdrop-blur">
                            <div className="text-3xl font-bold text-cisco-blue">{stat.value}</div>
                            <div className="text-gray-300 text-sm mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white dark:bg-gray-800">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Everything You Need to <span className="text-cisco-blue">Pass CCNA</span>
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                icon: '🎯',
                                title: 'AI Tutor',
                                description: 'Ask any networking question and get instant, detailed explanations with examples.',
                            },
                            {
                                icon: '⚡',
                                title: 'Practice Quizzes',
                                description: 'Test your knowledge with adaptive quizzes that focus on your weak areas.',
                            },
                            {
                                icon: '💻',
                                title: 'CLI Simulator',
                                description: 'Practice Cisco IOS commands in a realistic terminal environment.',
                            },
                            {
                                icon: '📚',
                                title: 'Flashcards',
                                description: 'Memorize key concepts with spaced repetition technology.',
                            },
                            {
                                icon: '🏆',
                                title: 'Progress Tracking',
                                description: 'Track your learning journey with detailed analytics and achievements.',
                            },
                            {
                                icon: '📝',
                                title: 'Exam Mode',
                                description: 'Simulate the real CCNA exam experience with timed practice tests.',
                            },
                        ].map((feature) => (
                            <div key={feature.title} className="card p-6 hover:shadow-lg transition-shadow">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-cisco-blue">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to Become CCNA Certified?
                    </h2>
                    <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                        Join thousands of students who have successfully passed their CCNA exam
                        using our AI-powered learning platform.
                    </p>
                    <Link href="/login" className="bg-white text-cisco-blue hover:bg-gray-100 btn btn-lg">
                        Start Your Journey
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-cisco-dark text-white py-12">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <svg className="w-8 h-8 text-cisco-blue" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            <span className="text-xl font-bold">CCNA Tutor</span>
                        </div>
                        <div className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} CCNA Tutor. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

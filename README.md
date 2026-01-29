# CCNA Tutor

AI-powered CCNA certification preparation platform with interactive learning, practice labs, and exam simulation.

## Features

- 🤖 **AI Tutor** - Ask any CCNA-related question and get instant, detailed explanations
- ⚡ **Practice Quizzes** - Test your knowledge with adaptive quizzes
- 🎴 **Flashcards** - Memorize key concepts with SM-2 spaced repetition
- 💻 **CLI Simulator** - Practice Cisco IOS commands in a realistic terminal
- 📝 **Exam Mode** - Simulate the real CCNA exam experience
- 📊 **Progress Tracking** - Track your learning journey with detailed analytics

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Neon Postgres with Drizzle ORM
- **Authentication**: Magic links via Resend, JWT sessions
- **LLM**: OpenAI API for content generation
- **Caching**: Vercel KV (Redis)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon Postgres database
- Resend account (for email)
- OpenAI API key
- Vercel KV (for caching)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd ccna-tutor
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file and fill in your values:
```bash
cp .env.example .env.local
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `RESEND_API_KEY` | Resend API key for magic link emails |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) |
| `OPENAI_API_KEY` | OpenAI API key for LLM features |
| `KV_REST_API_URL` | Vercel KV URL |
| `KV_REST_API_TOKEN` | Vercel KV token |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `ADMIN_EMAILS` | Comma-separated admin emails |

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Admin dashboard pages
│   ├── learn/            # Student learning pages
│   ├── login/            # Authentication pages
│   └── verify/           # Magic link verification
├── lib/
│   ├── auth/             # Authentication logic
│   ├── cache/            # Caching layer
│   ├── cli-simulator/    # CLI command parser
│   ├── db/               # Database schema & queries
│   ├── flashcard/        # SM-2 algorithm
│   ├── llm/              # LLM provider & generator
│   ├── progress/         # Progress tracking
│   ├── quiz/             # Quiz engine
│   └── tutor/            # Tutor runtime engine
├── types/                # TypeScript types
└── components/           # Reusable React components
```

## Deployment

Deploy to Vercel:

1. Connect your repository to Vercel
2. Set environment variables
3. Deploy

The app will automatically run database migrations on first deploy.

## License

MIT

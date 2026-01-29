import { NextRequest, NextResponse } from 'next/server';
import { getQuizzesByModule, startQuizAttempt, getQuizWithQuestions } from '@/lib/quiz/engine';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const module = searchParams.get('module') || 'ccna';

        const quizzes = await getQuizzesByModule(module);

        return NextResponse.json({
            success: true,
            data: quizzes,
        });
    } catch (error) {
        console.error('Quiz GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch quizzes' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { quizId } = body;

        if (!quizId) {
            return NextResponse.json(
                { success: false, error: 'Quiz ID required' },
                { status: 400 }
            );
        }

        const quizData = await getQuizWithQuestions(quizId);
        if (!quizData) {
            return NextResponse.json(
                { success: false, error: 'Quiz not found' },
                { status: 404 }
            );
        }

        const attemptId = await startQuizAttempt(quizId, user.id);

        // Return quiz with questions (without correct answers)
        const sanitizedQuestions = quizData.questions.map(q => ({
            id: q.id,
            type: q.type,
            difficulty: q.difficulty,
            questionText: q.questionText,
            questionHtml: q.questionHtml,
            options: q.options,
            timeLimit: q.timeLimit,
            points: q.points,
            hints: quizData.quiz.showExplanations ? q.hints : undefined,
        }));

        return NextResponse.json({
            success: true,
            data: {
                attemptId,
                quiz: {
                    id: quizData.quiz.id,
                    title: quizData.quiz.title,
                    timeLimit: quizData.quiz.timeLimit,
                    questionCount: quizData.quiz.questionCount,
                    shuffleOptions: quizData.quiz.shuffleOptions,
                },
                questions: sanitizedQuestions,
            },
        });
    } catch (error) {
        console.error('Quiz POST error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to start quiz' },
            { status: 500 }
        );
    }
}

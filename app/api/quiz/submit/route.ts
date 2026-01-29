import { NextRequest, NextResponse } from 'next/server';
import { submitQuizAttempt, getQuizWithQuestions, getWhyWrongExplanation } from '@/lib/quiz/engine';
import { getCurrentUser } from '@/lib/auth/session';
import { trackActivity, updateUserProgress, updateTopicProgress } from '@/lib/progress/tracker';
import { quizSubmitSchema } from '@/types';

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
        const parsed = quizSubmitSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid submission' },
                { status: 400 }
            );
        }

        const { attemptId, answers } = parsed.data;

        // Submit and score
        const result = await submitQuizAttempt(attemptId, user.id, answers);

        // Get quiz for XP calculation and topic tracking
        const quizData = await getQuizWithQuestions(result.quizId);

        // Calculate XP based on score
        const baseXP = 50;
        const bonusXP = Math.round(result.score / 2); // Up to 50 bonus XP
        const xpEarned = baseXP + bonusXP;

        // Track activity
        await trackActivity(
            user.id,
            'quiz_complete',
            'quiz',
            result.quizId,
            { score: result.score, passed: result.passed, timeSpent: result.timeSpent },
            result.timeSpent
        );

        // Update progress
        await updateUserProgress(user.id, 'ccna', result.timeSpent, xpEarned);

        // Update topic progress for each topic in the quiz
        if (quizData) {
            for (const topic of quizData.quiz.topics) {
                const topicScore = result.topicBreakdown[topic];
                await updateTopicProgress(user.id, 'ccna', topic, {
                    quizPassed: topicScore?.score >= quizData.quiz.passingScore,
                    score: topicScore?.score,
                    timeSpent: Math.round(result.timeSpent / quizData.quiz.topics.length),
                });
            }
        }

        // Add "why wrong" explanations for incorrect answers
        if (quizData) {
            const questionMap = new Map(quizData.questions.map(q => [q.id, q]));

            result.answers = result.answers.map(answer => {
                if (!answer.correct) {
                    const question = questionMap.get(answer.questionId);
                    if (question) {
                        return {
                            ...answer,
                            explanation: getWhyWrongExplanation(question, answer.answer),
                        };
                    }
                }
                return answer;
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                xpEarned,
            },
        });
    } catch (error) {
        console.error('Quiz submit error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to submit quiz' },
            { status: 500 }
        );
    }
}

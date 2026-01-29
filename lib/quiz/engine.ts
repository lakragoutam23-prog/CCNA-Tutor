import { db } from '@/lib/db';
import {
    questions,
    quizzes,
    quizQuestions,
    quizAttempts,
    Question,
    Quiz,
} from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { QuizResult, QuizAttemptAnswer } from '@/types';

export async function getQuizWithQuestions(quizId: string): Promise<{
    quiz: Quiz;
    questions: Question[];
} | null> {
    const [quiz] = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, quizId))
        .limit(1);

    if (!quiz) return null;

    const quizQuestionRecords = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quizId))
        .orderBy(quizQuestions.order);

    const questionIds = quizQuestionRecords.map(qq => qq.questionId);

    if (questionIds.length === 0) {
        return { quiz, questions: [] };
    }

    const questionRecords = await db
        .select()
        .from(questions)
        .where(
            and(
                inArray(questions.id, questionIds),
                eq(questions.status, 'published')
            )
        );

    // Maintain order
    const questionMap = new Map(questionRecords.map(q => [q.id, q]));
    const orderedQuestions = questionIds
        .map(id => questionMap.get(id))
        .filter(Boolean) as Question[];

    return { quiz, questions: orderedQuestions };
}

export async function startQuizAttempt(
    quizId: string,
    userId: string
): Promise<string> {
    const quizData = await getQuizWithQuestions(quizId);
    if (!quizData) throw new Error('Quiz not found');

    const { quiz, questions: quizQuestionsList } = quizData;

    // Check max attempts
    if (quiz.maxAttempts) {
        const existingAttempts = await db
            .select()
            .from(quizAttempts)
            .where(
                and(
                    eq(quizAttempts.quizId, quizId),
                    eq(quizAttempts.userId, userId)
                )
            );

        if (existingAttempts.length >= quiz.maxAttempts) {
            throw new Error('Maximum attempts reached');
        }
    }

    // Prepare question order (shuffle if enabled)
    let questionOrder = quizQuestionsList.map(q => q.id);
    if (quiz.shuffleQuestions) {
        questionOrder = shuffleArray(questionOrder);
    }

    // Create attempt
    const [attempt] = await db
        .insert(quizAttempts)
        .values({
            quizId,
            userId,
            totalCount: quizQuestionsList.length,
            questionOrder,
        })
        .returning();

    return attempt.id;
}

export async function submitQuizAttempt(
    attemptId: string,
    userId: string,
    answers: Array<{ questionId: string; answer: any; timeSpent: number }>
): Promise<QuizResult> {
    // Get attempt
    const [attempt] = await db
        .select()
        .from(quizAttempts)
        .where(
            and(
                eq(quizAttempts.id, attemptId),
                eq(quizAttempts.userId, userId)
            )
        )
        .limit(1);

    if (!attempt) throw new Error('Attempt not found');
    if (attempt.completedAt) throw new Error('Attempt already completed');

    // Get quiz and questions
    const quizData = await getQuizWithQuestions(attempt.quizId);
    if (!quizData) throw new Error('Quiz not found');

    const { quiz, questions: quizQuestionsList } = quizData;
    const questionMap = new Map(quizQuestionsList.map(q => [q.id, q]));

    // Score answers
    const scoredAnswers: QuizAttemptAnswer[] = [];
    const topicScores: Record<string, { correct: number; total: number }> = {};
    let correctCount = 0;
    let totalTimeSpent = 0;

    for (const answer of answers) {
        const question = questionMap.get(answer.questionId);
        if (!question) continue;

        const isCorrect = checkAnswer(question, answer.answer);
        const points = isCorrect ? question.points : 0;

        scoredAnswers.push({
            questionId: answer.questionId,
            answer: answer.answer,
            correct: isCorrect,
            timeSpent: answer.timeSpent,
            points,
        });

        if (isCorrect) correctCount++;
        totalTimeSpent += answer.timeSpent;

        // Track by topic
        if (!topicScores[question.topic]) {
            topicScores[question.topic] = { correct: 0, total: 0 };
        }
        topicScores[question.topic].total++;
        if (isCorrect) topicScores[question.topic].correct++;

        // Update question stats
        await db
            .update(questions)
            .set({
                usageCount: sql`${questions.usageCount} + 1`,
                correctRate: sql`(COALESCE(${questions.correctRate}, 0) * ${questions.usageCount} + ${isCorrect ? 1 : 0}) / (${questions.usageCount} + 1)`,
            })
            .where(eq(questions.id, question.id));
    }

    const score = quizQuestionsList.length > 0
        ? (correctCount / quizQuestionsList.length) * 100
        : 0;
    const passed = score >= quiz.passingScore;

    // Update attempt
    await db
        .update(quizAttempts)
        .set({
            completedAt: new Date(),
            timeSpent: totalTimeSpent,
            score,
            correctCount,
            passed,
            answers: scoredAnswers,
        })
        .where(eq(quizAttempts.id, attemptId));

    // Calculate topic breakdown
    const topicBreakdown: Record<string, { correct: number; total: number; score: number }> = {};
    for (const [topic, data] of Object.entries(topicScores)) {
        topicBreakdown[topic] = {
            ...data,
            score: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        };
    }

    return {
        attemptId,
        quizId: attempt.quizId,
        score,
        passed,
        correctCount,
        totalCount: quizQuestionsList.length,
        timeSpent: totalTimeSpent,
        answers: scoredAnswers,
        topicBreakdown,
    };
}

export function checkAnswer(question: Question, answer: any): boolean {
    const correct = question.correctAnswer;

    switch (question.type) {
        case 'multiple_choice':
            return answer === correct;

        case 'multiple_select':
            if (!Array.isArray(answer) || !Array.isArray(correct)) return false;
            return (
                answer.length === correct.length &&
                answer.every(a => correct.includes(a))
            );

        case 'drag_drop':
            if (typeof answer !== 'object' || typeof correct !== 'object') return false;
            return Object.keys(correct as object).every(
                key => answer[key] === (correct as Record<string, string>)[key]
            );

        case 'fill_blank':
            const correctLower = (correct as string).toLowerCase().trim();
            const answerLower = (answer as string).toLowerCase().trim();
            return correctLower === answerLower;

        default:
            return answer === correct;
    }
}

export function getWhyWrongExplanation(question: Question, answer: any): string {
    const wrongExplanations = question.wrongAnswerExplanations as Record<string, string>;

    if (wrongExplanations && typeof answer === 'string' && wrongExplanations[answer]) {
        return wrongExplanations[answer];
    }

    return question.explanation;
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export async function getQuizAttemptById(attemptId: string, userId: string) {
    const [attempt] = await db
        .select()
        .from(quizAttempts)
        .where(
            and(
                eq(quizAttempts.id, attemptId),
                eq(quizAttempts.userId, userId)
            )
        )
        .limit(1);

    return attempt;
}

export async function getQuizzesByModule(module: string) {
    return db
        .select()
        .from(quizzes)
        .where(
            and(
                eq(quizzes.module, module as any),
                eq(quizzes.status, 'published')
            )
        )
        .orderBy(quizzes.title);
}

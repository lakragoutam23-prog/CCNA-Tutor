import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserProgress, getTopicProgressForUser, initializeUserProgress } from '@/lib/db/progress-queries';
import { db } from '@/lib/db';
import { quizAttempts, labAttempts, userProgress } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get or initialize user progress
        let progress = await getUserProgress(user.id);
        if (!progress) {
            progress = await initializeUserProgress(user.id);
        }

        // Get topic progress
        const topicProgress = await getTopicProgressForUser(user.id);

        // Get quiz stats
        const [quizStats] = await db.select({
            totalQuizzes: sql<number>`count(*)::int`,
            avgScore: sql<number>`coalesce(avg(${quizAttempts.score}), 0)::float`,
            totalXP: sql<number>`coalesce(sum(${quizAttempts.earnedXp}), 0)::int`,
            passCount: sql<number>`count(*) filter (where ${quizAttempts.passed} = true)::int`,
        }).from(quizAttempts).where(eq(quizAttempts.userId, user.id));

        // Get recent quiz attempts
        const recentQuizzes = await db.select({
            id: quizAttempts.id,
            score: quizAttempts.score,
            passed: quizAttempts.passed,
            completedAt: quizAttempts.completedAt,
        })
            .from(quizAttempts)
            .where(eq(quizAttempts.userId, user.id))
            .orderBy(desc(quizAttempts.completedAt))
            .limit(5);

        // Get lab stats
        const [labStats] = await db.select({
            totalLabs: sql<number>`count(*)::int`,
            completedLabs: sql<number>`count(*) filter (where ${labAttempts.completed} = true)::int`,
        }).from(labAttempts).where(eq(labAttempts.userId, user.id));

        // Calculate total XP (from progress + quiz XP)
        const totalXP = (progress?.experiencePoints || 0) + (quizStats?.totalXP || 0);

        // Calculate level based on XP (every 100 XP = 1 level)
        const calculatedLevel = Math.floor(totalXP / 100) + 1;

        // Update user progress with latest XP if changed
        if (progress && totalXP !== progress.experiencePoints) {
            await db.update(userProgress)
                .set({
                    experiencePoints: totalXP,
                    level: calculatedLevel,
                    lastActivityAt: new Date(),
                })
                .where(eq(userProgress.userId, user.id));
        }

        return NextResponse.json({
            success: true,
            data: {
                userId: user.id,
                email: user.email,
                currentStreak: progress?.currentStreak || 0,
                longestStreak: progress?.longestStreak || 0,
                totalTimeSpent: progress?.totalTimeSpent || 0,
                level: calculatedLevel,
                experiencePoints: totalXP,
                topicsCompleted: topicProgress?.length || 0,
                lastStudyDate: progress?.lastActivityAt,
                topics: topicProgress || [],
                // Quiz stats
                quizStats: {
                    totalTaken: quizStats?.totalQuizzes || 0,
                    avgScore: Math.round(quizStats?.avgScore || 0),
                    passCount: quizStats?.passCount || 0,
                    passRate: quizStats?.totalQuizzes
                        ? Math.round((quizStats.passCount / quizStats.totalQuizzes) * 100)
                        : 0,
                },
                // Lab stats
                labStats: {
                    totalAttempted: labStats?.totalLabs || 0,
                    completed: labStats?.completedLabs || 0,
                },
                // Recent activity
                recentQuizzes: recentQuizzes || [],
            },
        });
    } catch (error) {
        console.error('Progress GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch progress' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { knowledgeNodes, questions, labs, users, generationJobs, quizAttempts, userProgress } from '@/lib/db/schema';
import { eq, sql, and, isNull, notInArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || !isAdmin(user.role)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        // Parallel fetch for stats - filter out soft-deleted nodes
        const [
            nodesCount,
            publishedCount,
            draftCount,
            quizzesCount,
            labsCount,
            usersCount,
            jobsCount,
            quizAttemptsCount,
            avgScoreResult,
            activeTodayResult
        ] = await Promise.all([
            db.select({ count: sql<number>`count(*)::int` }).from(knowledgeNodes).where(isNull(knowledgeNodes.deletedAt)),
            db.select({ count: sql<number>`count(*)::int` }).from(knowledgeNodes).where(and(eq(knowledgeNodes.status, 'published'), isNull(knowledgeNodes.deletedAt))),
            db.select({ count: sql<number>`count(*)::int` }).from(knowledgeNodes).where(and(eq(knowledgeNodes.status, 'draft'), isNull(knowledgeNodes.deletedAt))),
            db.select({ count: sql<number>`count(*)::int` }).from(questions),
            db.select({ count: sql<number>`count(*)::int` }).from(labs),
            db.select({ count: sql<number>`count(*)::int` }).from(users).where(notInArray(users.role, ['super_admin', 'admin', 'content_admin', 'faculty_reviewer'])),
            db.select({ count: sql<number>`count(*)::int` }).from(generationJobs).where(eq(generationJobs.status, 'running')),
            db.select({ count: sql<number>`count(*)::int` }).from(quizAttempts),
            db.select({ avg: sql<number>`avg(${quizAttempts.score})::float` }).from(quizAttempts),
            // Active users today (based on user_progress.lastActivityAt)
            db.execute(sql`SELECT count(distinct user_id)::int as count FROM ${userProgress} WHERE last_activity_at > NOW() - INTERVAL '24 hours'`),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                totalNodes: nodesCount[0].count,
                publishedNodes: publishedCount[0].count,
                draftNodes: draftCount[0].count,
                pendingReview: draftCount[0].count,
                totalQuizzes: quizzesCount[0].count,
                totalLabs: labsCount[0].count,
                activeUsers: usersCount[0].count,
                generationJobs: jobsCount[0].count,
                quizzesTaken: quizAttemptsCount[0].count,
                avgScore: Math.round(avgScoreResult[0].avg || 0),
                activeToday: (activeTodayResult as any).rows[0]?.count || 0,
            }
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}

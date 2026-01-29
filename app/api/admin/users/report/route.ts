import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { users, quizAttempts, labAttempts, userProgress } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !isAdmin(currentUser.role)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
        }

        // Fetch user data
        const [targetUser] = await db.select().from(users).where(eq(users.id, userId));

        if (!targetUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Fetch stats
        const [
            quizStats,
            labCount,
            progress
        ] = await Promise.all([
            db.select({
                count: sql<number>`count(*)::int`,
                avgScore: sql<number>`avg(${quizAttempts.score})::float`
            }).from(quizAttempts).where(eq(quizAttempts.userId, userId)),

            db.select({ count: sql<number>`count(*)::int` }).from(labAttempts).where(eq(labAttempts.userId, userId)),

            db.select().from(userProgress).where(eq(userProgress.userId, userId))
        ]);

        // Generate CSV content
        const rows = [
            ['Report Date', new Date().toISOString()],
            ['User ID', targetUser.id],
            ['Name', targetUser.name || 'N/A'],
            ['Email', targetUser.email],
            ['Role', targetUser.role],
            ['Joined', targetUser.createdAt.toISOString()],
            [],
            ['=== Activity Stats ==='],
            ['Level', progress[0]?.level || 1],
            ['XP', progress[0]?.experiencePoints || 0],
            ['Quizzes Taken', quizStats[0]?.count || 0],
            ['Average Quiz Score', Math.round(quizStats[0]?.avgScore || 0) + '%'],
            ['Labs Completed', labCount[0]?.count || 0],
        ];

        const csvContent = rows.map(row => row.join(',')).join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="report-${targetUser.email}-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
    }
}

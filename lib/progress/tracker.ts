import { db } from '@/lib/db';
import {
    userProgress,
    topicProgress,
    nodeProgress,
    activityLog,
    userAchievements,
    achievements,
} from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export async function trackActivity(
    userId: string,
    activityType: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
    duration?: number
): Promise<void> {
    await db.insert(activityLog).values({
        userId,
        activityType,
        entityType,
        entityId,
        metadata: metadata || {},
        duration,
    });
}

export async function updateUserProgress(
    userId: string,
    module: string,
    timeSpent: number,
    xpEarned: number = 0
): Promise<void> {
    // Check if progress exists
    const [existing] = await db
        .select()
        .from(userProgress)
        .where(
            and(
                eq(userProgress.userId, userId),
                eq(userProgress.module, module as any)
            )
        )
        .limit(1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (existing) {
        // Calculate streak
        let currentStreak = existing.currentStreak;
        let longestStreak = existing.longestStreak;

        if (existing.lastStreakDate) {
            const lastDate = new Date(existing.lastStreakDate);
            lastDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === 1) {
                // Consecutive day
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else if (daysDiff > 1) {
                // Streak broken
                currentStreak = 1;
            }
            // If same day, don't change streak
        } else {
            currentStreak = 1;
        }

        // Calculate level from XP
        const newXp = existing.experiencePoints + xpEarned;
        const newLevel = calculateLevel(newXp);

        await db
            .update(userProgress)
            .set({
                totalTimeSpent: sql`${userProgress.totalTimeSpent} + ${timeSpent}`,
                experiencePoints: newXp,
                level: newLevel,
                currentStreak,
                longestStreak,
                lastStreakDate: today,
                lastActivityAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(userProgress.id, existing.id));
    } else {
        // Create new progress record
        await db.insert(userProgress).values({
            userId,
            module: module as any,
            totalTimeSpent: timeSpent,
            experiencePoints: xpEarned,
            level: calculateLevel(xpEarned),
            currentStreak: 1,
            longestStreak: 1,
            lastStreakDate: today,
        });
    }
}

export async function updateTopicProgress(
    userId: string,
    module: string,
    topic: string,
    options: {
        nodeViewed?: boolean;
        quizPassed?: boolean;
        timeSpent?: number;
        score?: number;
    }
): Promise<void> {
    const [existing] = await db
        .select()
        .from(topicProgress)
        .where(
            and(
                eq(topicProgress.userId, userId),
                eq(topicProgress.module, module as any),
                eq(topicProgress.topic, topic)
            )
        )
        .limit(1);

    if (existing) {
        const updates: Record<string, any> = {
            lastAccessedAt: new Date(),
            updatedAt: new Date(),
        };

        if (options.nodeViewed) {
            updates.nodesViewed = sql`${topicProgress.nodesViewed} + 1`;
        }
        if (options.quizPassed) {
            updates.quizzesPassed = sql`${topicProgress.quizzesPassed} + 1`;
        }
        if (options.timeSpent) {
            updates.timeSpent = sql`${topicProgress.timeSpent} + ${options.timeSpent}`;
        }
        if (options.score !== undefined) {
            // Update average score
            const newAvg = existing.averageScore
                ? (existing.averageScore + options.score) / 2
                : options.score;
            updates.averageScore = newAvg;
        }

        // Update mastery level
        const masteryLevel = calculateMasteryLevel(
            existing.nodesViewed + (options.nodeViewed ? 1 : 0),
            existing.nodesTotal,
            existing.quizzesPassed + (options.quizPassed ? 1 : 0),
            existing.averageScore || options.score
        );
        updates.masteryLevel = masteryLevel;

        // Update status
        if (masteryLevel >= 90) {
            updates.status = 'mastered';
            if (!existing.completedAt) {
                updates.completedAt = new Date();
            }
        } else if (masteryLevel >= 70) {
            updates.status = 'completed';
        } else if (masteryLevel > 0) {
            updates.status = 'in_progress';
        }

        await db
            .update(topicProgress)
            .set(updates)
            .where(eq(topicProgress.id, existing.id));
    } else {
        // Create new topic progress
        await db.insert(topicProgress).values({
            userId,
            module: module as any,
            topic,
            status: 'in_progress',
            nodesViewed: options.nodeViewed ? 1 : 0,
            quizzesPassed: options.quizPassed ? 1 : 0,
            timeSpent: options.timeSpent || 0,
            averageScore: options.score,
            lastAccessedAt: new Date(),
        });
    }
}

export async function updateNodeProgress(
    userId: string,
    nodeId: string,
    timeSpent: number,
    understood?: boolean
): Promise<void> {
    const [existing] = await db
        .select()
        .from(nodeProgress)
        .where(
            and(
                eq(nodeProgress.userId, userId),
                eq(nodeProgress.nodeId, nodeId)
            )
        )
        .limit(1);

    if (existing) {
        await db
            .update(nodeProgress)
            .set({
                viewCount: sql`${nodeProgress.viewCount} + 1`,
                timeSpent: sql`${nodeProgress.timeSpent} + ${timeSpent}`,
                understood: understood !== undefined ? understood : existing.understood,
                lastViewedAt: new Date(),
            })
            .where(eq(nodeProgress.id, existing.id));
    } else {
        await db.insert(nodeProgress).values({
            userId,
            nodeId,
            viewed: true,
            viewCount: 1,
            timeSpent,
            understood,
            firstViewedAt: new Date(),
            lastViewedAt: new Date(),
        });
    }
}

export async function checkAndAwardAchievements(
    userId: string,
    module: string
): Promise<string[]> {
    const earnedAchievements: string[] = [];

    // Get all achievements
    const allAchievements = await db.select().from(achievements);

    // Get user's current achievements
    const userAchievementsList = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));

    const earnedIds = new Set(userAchievementsList.map(ua => ua.achievementId));

    // Get user progress
    const [progress] = await db
        .select()
        .from(userProgress)
        .where(
            and(
                eq(userProgress.userId, userId),
                eq(userProgress.module, module as any)
            )
        )
        .limit(1);

    for (const achievement of allAchievements) {
        if (earnedIds.has(achievement.id)) continue;

        const criteria = achievement.criteria as { type: string; value: number };
        let earned = false;

        if (progress) {
            switch (achievement.type) {
                case 'streak':
                    earned = progress.currentStreak >= criteria.value;
                    break;
                case 'mastery':
                    // Check topic mastery
                    break;
                case 'quiz_score':
                    // Check quiz scores
                    break;
            }
        }

        if (earned) {
            await db.insert(userAchievements).values({
                userId,
                achievementId: achievement.id,
            });

            // Award XP
            if (progress) {
                await db
                    .update(userProgress)
                    .set({
                        experiencePoints: sql`${userProgress.experiencePoints} + ${achievement.xpReward}`,
                    })
                    .where(eq(userProgress.id, progress.id));
            }

            earnedAchievements.push(achievement.name);
        }
    }

    return earnedAchievements;
}

export async function getRecentActivity(
    userId: string,
    limit: number = 20
) {
    return db
        .select()
        .from(activityLog)
        .where(eq(activityLog.userId, userId))
        .orderBy(desc(activityLog.createdAt))
        .limit(limit);
}

function calculateLevel(xp: number): number {
    // Level formula: level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function calculateMasteryLevel(
    nodesViewed: number,
    nodesTotal: number,
    quizzesPassed: number,
    averageScore?: number | null
): number {
    if (nodesTotal === 0) return 0;

    const viewProgress = nodesViewed / Math.max(nodesTotal, 1);
    const scoreProgress = (averageScore || 0) / 100;

    // Weighted average: 40% completion, 60% quiz scores
    return (viewProgress * 40) + (scoreProgress * 60);
}

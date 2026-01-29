import { db } from './index';
import { flashcards, flashcardProgress, flashcardReviews, users } from './schema';
import { eq, and, sql, asc, desc } from 'drizzle-orm';

// Get due flashcards for user (SM-2 algorithm)
export async function getDueFlashcards(userId: string, limit: number = 20) {
    try {
        // This is a simplified fetch - ideally we check nextReviewAt
        // For now we just fetch cards that haven't been reviewed or are due
        const dueCards = await db
            .select({
                id: flashcards.id,
                front: flashcards.front,
                back: flashcards.back,
                topic: flashcards.topic,
                difficulty: flashcards.difficulty,
            })
            .from(flashcards)
            .leftJoin(flashcardProgress, and(
                eq(flashcardProgress.flashcardId, flashcards.id),
                eq(flashcardProgress.userId, userId)
            ))
            .where(and(
                eq(flashcards.status, 'published'),
                sql`(${flashcardProgress.nextReviewAt} IS NULL OR ${flashcardProgress.nextReviewAt} <= NOW())`
            ))
            .limit(limit);

        return dueCards;
    } catch (error) {
        console.error('Error fetching due flashcards:', error);
        return [];
    }
}

// Record flashcard review (update progress)
export async function recordFlashcardReview(
    userId: string,
    flashcardId: string,
    rating: 'again' | 'hard' | 'good' | 'easy'
) {
    try {
        // Calculate new interval and ease factor (Simplified SM-2)
        // In a real app, we'd fetch current progress first
        const intervalMap = { again: 1, hard: 2, good: 4, easy: 7 };
        const nextReviewDays = intervalMap[rating];
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + nextReviewDays);

        // Update or insert progress
        await db
            .insert(flashcardProgress)
            .values({
                userId,
                flashcardId,
                nextReviewAt,
                repetitions: 1,
                totalReviews: 1,
                correctReviews: rating === 'again' ? 0 : 1,
            })
            .onConflictDoUpdate({
                target: [flashcardProgress.userId, flashcardProgress.flashcardId],
                set: {
                    nextReviewAt,
                    totalReviews: sql`${flashcardProgress.totalReviews} + 1`,
                    correctReviews: sql`${flashcardProgress.correctReviews} + ${rating === 'again' ? 0 : 1}`,
                    updatedAt: new Date(),
                },
            });

        // Log the review
        await db.insert(flashcardReviews).values({
            userId,
            flashcardId,
            rating,
        });

        return true;
    } catch (error) {
        console.error('Error recording review:', error);
        return false;
    }
}

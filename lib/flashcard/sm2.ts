import type { FlashcardRating } from '@/types';

/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * Based on the SuperMemo 2 algorithm by Piotr Wozniak
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface SM2State {
    easeFactor: number;  // E-Factor (1.3 - 2.5+)
    interval: number;    // Days until next review
    repetitions: number; // Consecutive correct answers
}

export interface SM2Result extends SM2State {
    nextReviewAt: Date;
}

// Quality grades map
const QUALITY_MAP: Record<FlashcardRating, number> = {
    again: 0,  // Complete failure
    hard: 3,   // Correct with significant difficulty
    good: 4,   // Correct with some hesitation
    easy: 5,   // Perfect recall
};

/**
 * Calculate the next review state based on user's rating
 */
export function calculateNextReview(
    currentState: SM2State,
    rating: FlashcardRating
): SM2Result {
    const quality = QUALITY_MAP[rating];
    let { easeFactor, interval, repetitions } = currentState;

    // If answer was incorrect (quality < 3), reset
    if (quality < 3) {
        repetitions = 0;
        interval = 1;
    } else {
        // Correct answer
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions++;
    }

    // Update ease factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Minimum ease factor is 1.3
    easeFactor = Math.max(1.3, newEaseFactor);

    // Calculate next review date
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    return {
        easeFactor,
        interval,
        repetitions,
        nextReviewAt,
    };
}

/**
 * Get initial state for a new flashcard
 */
export function getInitialState(): SM2State {
    return {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
    };
}

/**
 * Determine if a flashcard is due for review
 */
export function isDue(nextReviewAt: Date): boolean {
    return new Date() >= nextReviewAt;
}

/**
 * Determine mastery level based on repetitions and ease factor
 */
export function getMasteryLevel(state: SM2State): 'new' | 'learning' | 'review' | 'mastered' {
    if (state.repetitions === 0) {
        return 'new';
    } else if (state.repetitions < 3) {
        return 'learning';
    } else if (state.repetitions < 6 || state.easeFactor < 2.0) {
        return 'review';
    } else {
        return 'mastered';
    }
}

/**
 * Calculate study session priority
 * Lower numbers = higher priority (should be reviewed first)
 */
export function getReviewPriority(state: SM2State, nextReviewAt: Date): number {
    const now = new Date();
    const overdueDays = Math.max(0, (now.getTime() - nextReviewAt.getTime()) / (1000 * 60 * 60 * 24));

    // Priority factors:
    // 1. Overdue cards have highest priority
    // 2. New cards (repetitions = 0) come next
    // 3. Learning cards (low repetitions) come next
    // 4. Review cards come last

    if (overdueDays > 0) {
        return -1000 - overdueDays; // More overdue = higher priority
    }

    const masteryLevel = getMasteryLevel(state);

    switch (masteryLevel) {
        case 'new':
            return 0;
        case 'learning':
            return 100 + state.repetitions;
        case 'review':
            return 200 + state.repetitions;
        case 'mastered':
            return 300 + state.repetitions;
    }
}

/**
 * Estimate study time needed (in minutes)
 */
export function estimateStudyTime(cardsToReview: number): number {
    // Assume ~30 seconds per card on average
    return Math.ceil(cardsToReview * 0.5);
}

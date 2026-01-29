import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDueFlashcards, recordFlashcardReview } from '@/lib/db/flashcard-queries';
import { db } from '@/lib/db';
import { flashcards } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

const FLASHCARD_PROMPT = `You are a CCNA exam preparation expert. Generate exactly 5 flashcards for the given topic.

Return a JSON array with this exact structure:
[
  {
    "front": "Question or concept on the front of the card",
    "back": "Answer or explanation on the back",
    "difficulty": "beginner" | "intermediate" | "advanced"
  }
]

Make the flashcards:
- Exam-focused and practical
- Cover key concepts, commands, and troubleshooting
- Include a mix of difficulties
- Be concise but comprehensive

Return ONLY the JSON array, no other text.`;

// GET - Fetch flashcards (DB + LLM fallback)
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const topic = searchParams.get('topic');
        const generateNew = searchParams.get('generate') === 'true';

        // First, get all published flashcards from database
        let dbCards = await db
            .select({
                id: flashcards.id,
                front: flashcards.front,
                back: flashcards.back,
                topic: flashcards.topic,
                difficulty: flashcards.difficulty,
                source: flashcards.generatedBy,
            })
            .from(flashcards)
            .where(and(
                eq(flashcards.status, 'published'),
                isNull(flashcards.deletedAt)
            ));

        // Filter by topic if specified
        if (topic) {
            dbCards = dbCards.filter(c => c.topic.toLowerCase().includes(topic.toLowerCase()));
        }

        // If requesting new LLM cards or no cards exist
        if (generateNew || (dbCards.length === 0 && topic)) {
            try {
                const generatedCards = await generateFlashcardsWithLLM(topic || 'CCNA Fundamentals');

                // Save generated cards to database
                if (generatedCards.length > 0) {
                    const insertedCards = await db
                        .insert(flashcards)
                        .values(generatedCards.map(card => ({
                            front: card.front,
                            back: card.back,
                            topic: topic || 'CCNA Fundamentals',
                            difficulty: card.difficulty as 'beginner' | 'intermediate' | 'advanced',
                            status: 'published' as const,
                            generatedBy: 'llm' as const,
                            module: 'ccna' as const,
                        })))
                        .returning();

                    // Add newly generated cards to the response
                    dbCards = [
                        ...insertedCards.map(c => ({
                            id: c.id,
                            front: c.front,
                            back: c.back,
                            topic: c.topic,
                            difficulty: c.difficulty,
                            source: 'llm' as const,
                        })),
                        ...dbCards,
                    ];
                }
            } catch (llmError) {
                console.error('LLM generation failed:', llmError);
                // Continue with DB cards if LLM fails
            }
        }

        return NextResponse.json({
            success: true,
            data: dbCards,
            hasMore: dbCards.length > 0,
        });
    } catch (error) {
        console.error('Flashcards error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch flashcards' }, { status: 500 });
    }
}

// POST - Record review OR generate new cards
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // If generating new cards
        if (body.action === 'generate') {
            const topic = body.topic || 'CCNA Fundamentals';
            const generatedCards = await generateFlashcardsWithLLM(topic);

            if (generatedCards.length > 0) {
                const insertedCards = await db
                    .insert(flashcards)
                    .values(generatedCards.map(card => ({
                        front: card.front,
                        back: card.back,
                        topic: topic,
                        difficulty: card.difficulty as 'beginner' | 'intermediate' | 'advanced',
                        status: 'published' as const,
                        generatedBy: 'llm' as const,
                        module: 'ccna' as const,
                    })))
                    .returning();

                return NextResponse.json({
                    success: true,
                    data: insertedCards,
                    message: `Generated ${insertedCards.length} new flashcards`,
                });
            }

            return NextResponse.json({ success: false, error: 'Failed to generate cards' }, { status: 500 });
        }

        // Otherwise, record a review
        const { flashcardId, rating } = body;

        if (!flashcardId || !rating) {
            return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
        }

        await recordFlashcardReview(user.id, flashcardId, rating);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Flashcard POST error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
    }
}

async function generateFlashcardsWithLLM(topic: string): Promise<Array<{ front: string; back: string; difficulty: string }>> {
    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: FLASHCARD_PROMPT },
                { role: 'user', content: `Generate flashcards for: ${topic}` },
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const content = completion.choices[0]?.message?.content || '';

        // Parse JSON response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
                return parsed.filter(card => card.front && card.back).slice(0, 5);
            }
        }

        return [];
    } catch (error) {
        console.error('LLM flashcard generation error:', error);
        return [];
    }
}

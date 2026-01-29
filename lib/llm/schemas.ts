import { z } from 'zod';

export const llmKnowledgeNodeSchema = z.object({
    topic: z.string(),
    subtopic: z.string().optional(),
    intent: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    prerequisites: z.array(z.string()),
    coreExplanation: z.string(),
    mentalModel: z.string(),
    wireLogic: z.string(),
    cliExample: z.string().optional(),
    commonMistakes: z.array(z.string()),
    examNote: z.string().optional(),
});

export const llmBatchResponseSchema = z.object({
    nodes: z.array(llmKnowledgeNodeSchema),
    metadata: z.object({
        generatedAt: z.string(),
        model: z.string(),
        tokensUsed: z.number().optional(),
    }),
});

export const llmQuestionSchema = z.object({
    questionText: z.string(),
    type: z.enum(['multiple_choice', 'multiple_select', 'fill_blank']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    options: z.array(z.object({
        id: z.string(),
        text: z.string(),
        isCorrect: z.boolean(),
    })),
    correctAnswer: z.union([z.string(), z.array(z.string())]),
    explanation: z.string(),
    wrongAnswerExplanations: z.record(z.string()).optional(),
    hints: z.array(z.string()).optional(),
});

export const llmQuestionBatchSchema = z.object({
    questions: z.array(llmQuestionSchema),
    metadata: z.object({
        topic: z.string(),
        generatedAt: z.string(),
    }),
});

export const llmFlashcardSchema = z.object({
    front: z.string(),
    back: z.string(),
    tags: z.array(z.string()).optional(),
});

export const llmFlashcardBatchSchema = z.object({
    flashcards: z.array(llmFlashcardSchema),
    metadata: z.object({
        topic: z.string(),
        generatedAt: z.string(),
    }),
});

export const llmTutorResponseSchema = z.object({
    answer: z.string(),
    concept: z.string(),
    mentalModel: z.string(),
    wireLogic: z.string(),
    cliExample: z.string().optional(),
    commonMistakes: z.array(z.string()).optional(),
    examNote: z.string().optional(),
    relatedTopics: z.array(z.string()).optional(),
});

export type LLMKnowledgeNode = z.infer<typeof llmKnowledgeNodeSchema>;
export type LLMBatchResponse = z.infer<typeof llmBatchResponseSchema>;
export type LLMQuestion = z.infer<typeof llmQuestionSchema>;
export type LLMQuestionBatch = z.infer<typeof llmQuestionBatchSchema>;
export type LLMFlashcard = z.infer<typeof llmFlashcardSchema>;
export type LLMFlashcardBatch = z.infer<typeof llmFlashcardBatchSchema>;
export type LLMTutorResponse = z.infer<typeof llmTutorResponseSchema>;

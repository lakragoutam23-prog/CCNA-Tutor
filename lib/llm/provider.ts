import Groq from 'groq-sdk';

export type LLMProvider = 'groq';

interface LLMConfig {
    provider: LLMProvider;
    model: string;
    temperature: number;
    maxTokens?: number;
}

// Create Groq client only if API key is available
const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

function getGroqClient(): Groq {
    if (!groq) {
        throw new Error('Groq API key not configured. Set GROQ_API_KEY environment variable.');
    }
    return groq;
}

export async function generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    config: LLMConfig
): Promise<string> {
    const client = getGroqClient();
    const response = await client.chat.completions.create({
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.maxTokens || 4096,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    });

    return response.choices[0]?.message?.content || '';
}

export async function generateChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config: Partial<LLMConfig> = {}
): Promise<string> {
    const finalConfig: LLMConfig = {
        provider: 'groq',
        model: config.model || 'llama-3.1-8b-instant',
        temperature: config.temperature ?? 0.7,
        maxTokens: config.maxTokens || 2048,
    };

    const client = getGroqClient();
    const response = await client.chat.completions.create({
        model: finalConfig.model,
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.maxTokens,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    });

    return response.choices[0]?.message?.content || '';
}

export function estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
}

import { NextResponse } from 'next/server';
import { generateChatCompletion } from '@/lib/llm/provider';

const SYSTEM_PROMPT = `You are an expert CCNA Tutor. Your goal is to help students prepare for the CCNA 200-301 exam.
You provide clear, concise explanations of networking concepts, configuration examples, and troubleshooting tips.

IMPORTANT: You MUST return your response in a strict JSON format with a single key "content".
Example:
{
  "content": "A VLAN (Virtual Local Area Network) is a logical grouping of devices in the same broadcast domain..."
}

Do not include any text outside the JSON object.
Keep your explanations accurate, strictly related to the CCNA curriculum, and helpful.
Use formatting like bolding for key terms and code blocks for configuration commands.`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // Extract the last user message
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || !lastMessage.content) {
            return NextResponse.json({ error: 'Message content required' }, { status: 400 });
        }

        // Call the LLM provider
        // We pass the last message as the user prompt. 
        // In a more advanced implementation, we might summarize context or pass full history if the provider supports it easily.
        // For now, let's pass the last message to keep it simple and stateless-ish, 
        // or we can construct a history string if we want context.

        // Constructing a simple context interactions string from the last few messages
        const contextMessages = messages.slice(-5); // Keep last 5 messages for context
        const conversationHistory = contextMessages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const finalPrompt = `Conversation History:\n${conversationHistory}\n\nRespond to the last USER message as the AI Tutor in JSON format.`;

        const responseJson = await generateChatCompletion(SYSTEM_PROMPT, finalPrompt, {
            temperature: 0.7,
            model: 'llama-3.1-8b-instant' // Fast model for chat
        });

        const parsedResponse = JSON.parse(responseJson);

        return NextResponse.json({
            content: parsedResponse.content
        });

    } catch (error) {
        console.error('AI Tutor Error:', error);
        return NextResponse.json({
            error: 'Failed to generate response',
            content: "I'm currently having trouble connecting to my neural network. Please try again in a moment."
        }, { status: 500 });
    }
}

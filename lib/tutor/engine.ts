import { searchKnowledgeByIntent, getKnowledgeNodeByIntent } from '@/lib/db/queries';
import { getCachedTutorResponse, setCachedTutorResponse } from '@/lib/cache';
import { generateChatCompletion } from '@/lib/llm/provider';
import type { TutorResponse } from '@/types';

const TUTOR_SYSTEM_PROMPT = `You are a CCNA tutor helping students understand networking concepts.

RESPONSE STYLE:
- Be conversational but technically precise
- Use analogies to explain complex concepts
- Always explain the "why" behind concepts
- Relate explanations to real-world scenarios
- Include CLI examples when relevant

LEARN MODE:
- Provide comprehensive explanations
- Include mental models and analogies
- Give detailed CLI examples
- Mention common mistakes

EXAM MODE:
- Focus on exam-relevant points
- Be more concise
- Highlight what Cisco typically tests
- Mention common wrong answer traps

Always structure your response as JSON:
{
  "answer": "Main explanation",
  "concept": "Core concept being explained",
  "mentalModel": "Visual/conceptual framework",
  "wireLogic": "What happens at network level",
  "cliExample": "Relevant CLI commands (optional)",
  "commonMistakes": ["Array of mistakes"],
  "examNote": "Exam-specific notes (optional)",
  "relatedTopics": ["Related topics to explore"]
}`;

export async function answerQuery(
    query: string,
    module: string = 'ccna',
    mode: 'learn' | 'exam' = 'learn'
): Promise<TutorResponse> {
    const startTime = Date.now();

    // 1. Check cache first
    const cached = await getCachedTutorResponse(query, module);
    if (cached) {
        return {
            ...(cached as TutorResponse),
            source: 'cache',
            latency: Date.now() - startTime,
        };
    }

    // 2. Search database for matching knowledge nodes
    const nodes = await searchKnowledgeByIntent(query, module);

    if (nodes.length > 0) {
        const bestMatch = nodes[0];
        const response: TutorResponse = {
            topic: bestMatch.topic,
            intent: bestMatch.intent,
            explanation: {
                concept: bestMatch.coreExplanation,
                mentalModel: bestMatch.mentalModel,
                wireLogic: bestMatch.wireLogic,
                cliExample: bestMatch.cliExample || undefined,
            },
            commonMistakes: bestMatch.commonMistakes || [],
            examNote: mode === 'exam' ? bestMatch.examNote || undefined : undefined,
            mode,
            source: 'database',
            latency: Date.now() - startTime,
        };

        // Cache the response
        await setCachedTutorResponse(query, module, response);

        return response;
    }

    // 3. Try to find by exact intent match
    const exactMatch = await getKnowledgeNodeByIntent(query, module);
    if (exactMatch) {
        const response: TutorResponse = {
            topic: exactMatch.topic,
            intent: exactMatch.intent,
            explanation: {
                concept: exactMatch.coreExplanation,
                mentalModel: exactMatch.mentalModel,
                wireLogic: exactMatch.wireLogic,
                cliExample: exactMatch.cliExample || undefined,
            },
            commonMistakes: exactMatch.commonMistakes || [],
            examNote: mode === 'exam' ? exactMatch.examNote || undefined : undefined,
            mode,
            source: 'database',
            latency: Date.now() - startTime,
        };

        await setCachedTutorResponse(query, module, response);

        return response;
    }

    // 4. Fall back to LLM (only if enabled)
    try {
        const modeInstruction = mode === 'exam'
            ? 'Focus on exam-relevant points. Be concise and highlight what Cisco tests.'
            : 'Provide a comprehensive explanation with examples and analogies.';

        const userPrompt = `Question: ${query}

Mode: ${mode.toUpperCase()}
${modeInstruction}

Provide a helpful explanation following the CCNA teaching framework.`;

        const llmResponse = await generateChatCompletion(
            TUTOR_SYSTEM_PROMPT,
            userPrompt,
            { temperature: 0.7 }
        );

        const parsed = JSON.parse(llmResponse);

        const response: TutorResponse = {
            topic: parsed.concept || 'General',
            intent: query,
            explanation: {
                concept: parsed.answer || parsed.concept,
                mentalModel: parsed.mentalModel || '',
                wireLogic: parsed.wireLogic || '',
                cliExample: parsed.cliExample,
            },
            commonMistakes: parsed.commonMistakes || [],
            examNote: mode === 'exam' ? parsed.examNote : undefined,
            mode,
            source: 'llm',
            latency: Date.now() - startTime,
        };

        // Cache LLM response (shorter TTL)
        await setCachedTutorResponse(query, module, response);

        return response;
    } catch (error) {
        console.error('LLM fallback error:', error);

        // Return a fallback response
        return {
            topic: 'Unknown',
            intent: query,
            explanation: {
                concept: 'I apologize, but I could not find information about this topic in the current knowledge base. Please try rephrasing your question or check the topic list for available content.',
                mentalModel: '',
                wireLogic: '',
            },
            commonMistakes: [],
            mode,
            source: 'database',
            latency: Date.now() - startTime,
        };
    }
}

export async function classifyIntent(query: string): Promise<{
    topic: string;
    subtopic?: string;
    type: 'definition' | 'how_it_works' | 'configuration' | 'troubleshooting' | 'comparison' | 'exam';
}> {
    // Simple keyword-based classification
    const lowerQuery = query.toLowerCase();

    let type: 'definition' | 'how_it_works' | 'configuration' | 'troubleshooting' | 'comparison' | 'exam' = 'definition';

    if (lowerQuery.includes('how') || lowerQuery.includes('why') || lowerQuery.includes('work')) {
        type = 'how_it_works';
    } else if (lowerQuery.includes('configure') || lowerQuery.includes('setup') || lowerQuery.includes('command')) {
        type = 'configuration';
    } else if (lowerQuery.includes('troubleshoot') || lowerQuery.includes('problem') || lowerQuery.includes('fix')) {
        type = 'troubleshooting';
    } else if (lowerQuery.includes('vs') || lowerQuery.includes('versus') || lowerQuery.includes('difference')) {
        type = 'comparison';
    } else if (lowerQuery.includes('exam') || lowerQuery.includes('test') || lowerQuery.includes('certification')) {
        type = 'exam';
    }

    // Extract topic from query
    const topic = extractTopic(query);

    return { topic, type };
}

function extractTopic(query: string): string {
    // Common CCNA topics
    const topics = [
        'VLAN', 'STP', 'OSPF', 'EIGRP', 'BGP', 'ACL', 'NAT', 'DHCP', 'DNS',
        'Subnetting', 'IPv4', 'IPv6', 'Routing', 'Switching', 'ARP', 'MAC',
        'TCP', 'UDP', 'OSI', 'Ethernet', 'Wireless', 'Security', 'VPN',
        'QoS', 'SDN', 'Automation', 'Cloud', 'WAN', 'LAN'
    ];

    const lowerQuery = query.toLowerCase();

    for (const topic of topics) {
        if (lowerQuery.includes(topic.toLowerCase())) {
            return topic;
        }
    }

    return 'General Networking';
}

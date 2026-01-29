import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// CCNA topics for question generation
const ccnaTopics = {
    'ccna-full': ['OSPF', 'EIGRP', 'STP', 'VLANs', 'ACLs', 'NAT', 'DHCP', 'DNS', 'IPv4', 'IPv6', 'Subnetting', 'Routing', 'Switching'],
    'ccna-network': ['OSI Model', 'TCP/IP', 'IP Addressing', 'Subnetting', 'Network Types', 'Cabling', 'Network Devices'],
    'ccna-routing': ['Static Routing', 'OSPF', 'EIGRP', 'Routing Tables', 'Administrative Distance', 'Route Selection', 'Inter-VLAN Routing'],
    'ccna-security': ['ACLs', 'Port Security', 'AAA', 'VPNs', 'Firewalls', 'Threat Types', 'Security Best Practices'],
};

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { examType = 'ccna-full', questionCount = 10 } = body;

        const topics = ccnaTopics[examType as keyof typeof ccnaTopics] || ccnaTopics['ccna-full'];
        const selectedTopics = topics.sort(() => Math.random() - 0.5).slice(0, 5);

        const prompt = `Generate ${questionCount} CCNA certification exam practice questions covering these topics: ${selectedTopics.join(', ')}.

For each question, provide:
1. A clear, exam-style question about networking concepts
2. Four answer options (A, B, C, D)
3. The correct answer letter
4. A brief explanation of why it's correct

Return ONLY a valid JSON array with this exact structure:
[
  {
    "questionText": "What is the primary function of OSPF?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": "A",
    "explanation": "OSPF is a link-state routing protocol...",
    "topic": "OSPF",
    "difficulty": "medium"
  }
]

Make questions realistic and similar to actual CCNA exam questions. Cover practical scenarios and command syntax where applicable.`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a CCNA exam question generator. Generate accurate, exam-quality networking questions. Always return valid JSON only, no markdown or extra text.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 4000,
        });

        const responseText = completion.choices[0]?.message?.content || '[]';

        // Parse JSON from response
        let questions;
        try {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                questions = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.error('Failed to parse LLM response:', responseText);
            // Return fallback questions
            questions = generateFallbackQuestions(selectedTopics, questionCount);
        }

        // Transform to our format
        const formattedQuestions = questions.map((q: any, i: number) => ({
            id: `llm-${Date.now()}-${i}`,
            type: 'mcq',
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.options[q.correctAnswer.charCodeAt(0) - 65] || q.options[0],
            explanation: q.explanation || '',
            topic: q.topic || selectedTopics[i % selectedTopics.length],
            difficulty: q.difficulty || 'medium',
            points: 10,
        }));

        return NextResponse.json({
            success: true,
            data: {
                questions: formattedQuestions,
                topics: selectedTopics,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Error generating questions:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate questions' }, { status: 500 });
    }
}

function generateFallbackQuestions(topics: string[], count: number) {
    const fallbackQuestions = [
        {
            questionText: 'Which layer of the OSI model is responsible for logical addressing?',
            options: ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Session Layer'],
            correctAnswer: 'B',
            explanation: 'The Network Layer (Layer 3) handles logical addressing using IP addresses.',
            topic: 'OSI Model',
            difficulty: 'easy',
        },
        {
            questionText: 'What is the default administrative distance for OSPF?',
            options: ['90', '100', '110', '120'],
            correctAnswer: 'C',
            explanation: 'OSPF has a default administrative distance of 110.',
            topic: 'OSPF',
            difficulty: 'medium',
        },
        {
            questionText: 'Which command displays the routing table on a Cisco router?',
            options: ['show routes', 'show ip route', 'display routing', 'get routes'],
            correctAnswer: 'B',
            explanation: 'The "show ip route" command displays the IP routing table.',
            topic: 'Routing',
            difficulty: 'easy',
        },
        {
            questionText: 'What is the purpose of a VLAN?',
            options: ['Increase network speed', 'Segment broadcast domains', 'Replace routers', 'Encrypt traffic'],
            correctAnswer: 'B',
            explanation: 'VLANs segment broadcast domains, improving network efficiency and security.',
            topic: 'VLANs',
            difficulty: 'easy',
        },
        {
            questionText: 'Which protocol uses port 443?',
            options: ['HTTP', 'FTP', 'HTTPS', 'SSH'],
            correctAnswer: 'C',
            explanation: 'HTTPS uses TCP port 443 for secure web communication.',
            topic: 'TCP/IP',
            difficulty: 'easy',
        },
        {
            questionText: 'What is the subnet mask for a /24 network?',
            options: ['255.255.0.0', '255.255.255.0', '255.255.255.128', '255.255.255.192'],
            correctAnswer: 'B',
            explanation: 'A /24 prefix means 24 bits for the network, giving 255.255.255.0.',
            topic: 'Subnetting',
            difficulty: 'easy',
        },
        {
            questionText: 'Which STP port state forwards user traffic?',
            options: ['Blocking', 'Listening', 'Learning', 'Forwarding'],
            correctAnswer: 'D',
            explanation: 'Only ports in the Forwarding state can send and receive user data.',
            topic: 'STP',
            difficulty: 'medium',
        },
        {
            questionText: 'What does NAT stand for?',
            options: ['Network Access Translation', 'Network Address Translation', 'Node Address Transfer', 'Network Area Transition'],
            correctAnswer: 'B',
            explanation: 'NAT stands for Network Address Translation.',
            topic: 'NAT',
            difficulty: 'easy',
        },
        {
            questionText: 'Which OSPF packet type establishes neighbor relationships?',
            options: ['LSA', 'Hello', 'DBD', 'LSR'],
            correctAnswer: 'B',
            explanation: 'Hello packets are used to discover and maintain OSPF neighbor relationships.',
            topic: 'OSPF',
            difficulty: 'medium',
        },
        {
            questionText: 'What is the maximum hop count for RIP?',
            options: ['10', '15', '16', '255'],
            correctAnswer: 'B',
            explanation: 'RIP has a maximum hop count of 15; 16 means unreachable.',
            topic: 'Routing',
            difficulty: 'medium',
        },
    ];

    return fallbackQuestions.slice(0, count);
}

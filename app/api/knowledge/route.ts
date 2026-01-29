import { NextRequest, NextResponse } from 'next/server';
import { getPublishedKnowledgeNodes, getTopics } from '@/lib/db/queries';
import { getCachedTopics, setCachedTopics } from '@/lib/cache';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const module = searchParams.get('module') || 'ccna';
        const topic = searchParams.get('topic') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        const offset = (page - 1) * pageSize;

        const nodes = await getPublishedKnowledgeNodes(module, topic, pageSize, offset);

        return NextResponse.json({
            success: true,
            data: nodes,
            page,
            pageSize,
            hasMore: nodes.length === pageSize,
        });
    } catch (error) {
        console.error('Knowledge GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch knowledge' },
            { status: 500 }
        );
    }
}

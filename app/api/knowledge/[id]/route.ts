import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeNodeById } from '@/lib/db/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { trackActivity, updateNodeProgress, updateTopicProgress } from '@/lib/progress/tracker';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const node = await getKnowledgeNodeById(id);

        if (!node) {
            return NextResponse.json(
                { success: false, error: 'Knowledge node not found' },
                { status: 404 }
            );
        }

        // Check access for unpublished nodes
        if (node.status !== 'published') {
            const adminRoles = ['content_admin', 'super_admin', 'faculty_reviewer'];
            if (!adminRoles.includes(user.role)) {
                return NextResponse.json(
                    { success: false, error: 'Access denied' },
                    { status: 403 }
                );
            }
        }

        // Track view and progress for published nodes
        if (node.status === 'published') {
            await trackActivity(user.id, 'view', 'knowledge_node', id);
            await updateNodeProgress(user.id, id, node.estimatedMinutes || 10);
            await updateTopicProgress(user.id, node.module, node.topic, {
                nodeViewed: true,
                timeSpent: node.estimatedMinutes || 10,
            });
        }

        return NextResponse.json({
            success: true,
            data: node,
        });
    } catch (error) {
        console.error('Knowledge GET by ID error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch knowledge node' },
            { status: 500 }
        );
    }
}

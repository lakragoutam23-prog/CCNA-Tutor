import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateRoleSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(['student', 'faculty_reviewer', 'content_admin', 'super_admin']),
});

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || !isAdmin(user.role)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const validation = updateRoleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
        }

        const { userId, role } = validation.data;

        // Prevent modifying own role to avoid locking oneself out (optional but good practice)
        if (userId === user.id) {
            return NextResponse.json({ success: false, error: 'Cannot modify your own role' }, { status: 400 });
        }

        await db.update(users)
            .set({ role })
            .where(eq(users.id, userId));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Update role error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
    }
}

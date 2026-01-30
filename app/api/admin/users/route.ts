import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc, eq, notInArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || !isAdmin(user.role)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const allUsers = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.role, 'student'))
            .orderBy(desc(users.createdAt))
            .limit(100);

        return NextResponse.json({
            success: true,
            data: allUsers.map(u => ({
                ...u,
                createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown',
            })),
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        // Only super_admin can delete users
        if (!user || user.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === user.id) {
            return NextResponse.json({ success: false, error: 'Cannot delete yourself' }, { status: 400 });
        }

        await db.delete(users).where(eq(users.id, userId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
    }
}

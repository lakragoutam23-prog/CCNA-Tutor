import { db } from './index';
import {
    knowledgeNodes,
    users,
    sessions,
    magicLinks,
    generationJobs,
    knowledgeVersions,
    auditLog,
    syllabus,
    KnowledgeNode,
    NewKnowledgeNode,
    User,
} from './schema';
import { eq, and, desc, asc, sql, ilike, or, gt, lt, inArray } from 'drizzle-orm';

// ============ USER QUERIES ============
export async function getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
    return user;
}

export async function createUser(email: string, role: User['role'] = 'student'): Promise<User> {
    const [user] = await db
        .insert(users)
        .values({ email: email.toLowerCase(), role })
        .returning();
    return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
}

export async function updateUserLastLogin(userId: string): Promise<void> {
    await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId));
}

export async function getAllUsers(limit: number = 100, offset: number = 0) {
    return db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);
}

// ============ SESSION QUERIES ============
export async function createSession(userId: string, expiresAt: Date): Promise<string> {
    const [session] = await db
        .insert(sessions)
        .values({ userId, expiresAt })
        .returning({ id: sessions.id });
    return session.id;
}

export async function getSession(sessionId: string) {
    const [session] = await db
        .select({
            session: sessions,
            user: users,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
            and(
                eq(sessions.id, sessionId),
                gt(sessions.expiresAt, new Date())
            )
        )
        .limit(1);
    return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

// ============ MAGIC LINK QUERIES ============
export async function createMagicLink(email: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(magicLinks).values({
        email: email.toLowerCase(),
        token,
        expiresAt,
    });
}

export async function verifyMagicLink(token: string) {
    const [link] = await db
        .select()
        .from(magicLinks)
        .where(
            and(
                eq(magicLinks.token, token),
                gt(magicLinks.expiresAt, new Date()),
                sql`${magicLinks.usedAt} IS NULL`
            )
        )
        .limit(1);

    if (link) {
        await db
            .update(magicLinks)
            .set({ usedAt: new Date() })
            .where(eq(magicLinks.id, link.id));
    }

    return link;
}

// ============ KNOWLEDGE NODE QUERIES ============
export async function getPublishedKnowledgeNodes(
    module: string = 'ccna',
    topic?: string,
    limit: number = 50,
    offset: number = 0
): Promise<KnowledgeNode[]> {
    const conditions = [
        eq(knowledgeNodes.status, 'published'),
        eq(knowledgeNodes.module, module as any),
        sql`${knowledgeNodes.deletedAt} IS NULL`,
    ];

    if (topic) {
        conditions.push(eq(knowledgeNodes.topic, topic));
    }

    return db
        .select()
        .from(knowledgeNodes)
        .where(and(...conditions))
        .orderBy(asc(knowledgeNodes.topic))
        .limit(limit)
        .offset(offset);
}

export async function searchKnowledgeByIntent(
    searchTerm: string,
    module: string = 'ccna'
): Promise<KnowledgeNode[]> {
    return db
        .select()
        .from(knowledgeNodes)
        .where(
            and(
                eq(knowledgeNodes.status, 'published'),
                eq(knowledgeNodes.module, module as any),
                sql`${knowledgeNodes.deletedAt} IS NULL`,
                or(
                    ilike(knowledgeNodes.intent, `%${searchTerm}%`),
                    ilike(knowledgeNodes.topic, `%${searchTerm}%`),
                    ilike(knowledgeNodes.coreExplanation, `%${searchTerm}%`)
                )
            )
        )
        .limit(10);
}

export async function getKnowledgeNodeById(id: string): Promise<KnowledgeNode | undefined> {
    const [node] = await db
        .select()
        .from(knowledgeNodes)
        .where(eq(knowledgeNodes.id, id))
        .limit(1);
    return node;
}

export async function getKnowledgeNodeByIntent(
    intent: string,
    module: string = 'ccna'
): Promise<KnowledgeNode | undefined> {
    const [node] = await db
        .select()
        .from(knowledgeNodes)
        .where(
            and(
                eq(knowledgeNodes.status, 'published'),
                eq(knowledgeNodes.module, module as any),
                sql`${knowledgeNodes.deletedAt} IS NULL`,
                ilike(knowledgeNodes.intent, `%${intent}%`)
            )
        )
        .limit(1);
    return node;
}

export async function createKnowledgeNode(data: NewKnowledgeNode): Promise<KnowledgeNode> {
    const [node] = await db.insert(knowledgeNodes).values(data).returning();
    return node;
}

export async function updateKnowledgeNode(
    id: string,
    data: Partial<NewKnowledgeNode>
): Promise<KnowledgeNode> {
    const [node] = await db
        .update(knowledgeNodes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(knowledgeNodes.id, id))
        .returning();
    return node;
}

export async function publishKnowledgeNode(
    id: string,
    reviewedBy: string
): Promise<KnowledgeNode> {
    const [node] = await db
        .update(knowledgeNodes)
        .set({
            status: 'published',
            publishedAt: new Date(),
            reviewedBy,
            updatedAt: new Date(),
        })
        .where(eq(knowledgeNodes.id, id))
        .returning();
    return node;
}

export async function approveKnowledgeNode(
    id: string,
    reviewedBy: string,
    reviewNotes?: string
): Promise<KnowledgeNode> {
    const [node] = await db
        .update(knowledgeNodes)
        .set({
            status: 'approved',
            reviewedBy,
            reviewNotes,
            updatedAt: new Date(),
        })
        .where(eq(knowledgeNodes.id, id))
        .returning();
    return node;
}

export async function softDeleteKnowledgeNode(id: string): Promise<void> {
    await db
        .update(knowledgeNodes)
        .set({ deletedAt: new Date() })
        .where(eq(knowledgeNodes.id, id));
}

// Admin queries
export async function getAllKnowledgeNodes(
    status?: string,
    module?: string,
    limit: number = 100,
    offset: number = 0
): Promise<KnowledgeNode[]> {
    const conditions = [sql`${knowledgeNodes.deletedAt} IS NULL`];

    if (status) {
        conditions.push(eq(knowledgeNodes.status, status as any));
    }
    if (module) {
        conditions.push(eq(knowledgeNodes.module, module as any));
    }

    return db
        .select()
        .from(knowledgeNodes)
        .where(and(...conditions))
        .orderBy(desc(knowledgeNodes.updatedAt))
        .limit(limit)
        .offset(offset);
}

export async function getReviewQueue(
    module: string = 'ccna'
): Promise<KnowledgeNode[]> {
    return db
        .select()
        .from(knowledgeNodes)
        .where(
            and(
                eq(knowledgeNodes.module, module as any),
                sql`${knowledgeNodes.deletedAt} IS NULL`,
                or(
                    eq(knowledgeNodes.status, 'draft'),
                    eq(knowledgeNodes.status, 'approved')
                )
            )
        )
        .orderBy(asc(knowledgeNodes.createdAt));
}

export async function getKnowledgeStats(module: string = 'ccna') {
    const stats = await db
        .select({
            status: knowledgeNodes.status,
            count: sql<number>`count(*)::int`,
        })
        .from(knowledgeNodes)
        .where(
            and(
                eq(knowledgeNodes.module, module as any),
                sql`${knowledgeNodes.deletedAt} IS NULL`
            )
        )
        .groupBy(knowledgeNodes.status);

    return stats.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
    }, {} as Record<string, number>);
}

// ============ VERSION HISTORY ============
export async function saveKnowledgeVersion(
    nodeId: string,
    version: number,
    data: object,
    changedBy?: string,
    changeReason?: string
): Promise<void> {
    await db.insert(knowledgeVersions).values({
        nodeId,
        version,
        data,
        changedBy,
        changeReason,
    });
}

export async function getKnowledgeVersions(nodeId: string) {
    return db
        .select()
        .from(knowledgeVersions)
        .where(eq(knowledgeVersions.nodeId, nodeId))
        .orderBy(desc(knowledgeVersions.version));
}

export async function rollbackKnowledgeNode(
    nodeId: string,
    version: number,
    userId: string
): Promise<KnowledgeNode | null> {
    const [targetVersion] = await db
        .select()
        .from(knowledgeVersions)
        .where(
            and(
                eq(knowledgeVersions.nodeId, nodeId),
                eq(knowledgeVersions.version, version)
            )
        )
        .limit(1);

    if (!targetVersion) return null;

    const currentNode = await getKnowledgeNodeById(nodeId);
    if (!currentNode) return null;

    // Save current state before rollback
    await saveKnowledgeVersion(
        nodeId,
        currentNode.version + 1,
        currentNode,
        userId,
        `Rollback to version ${version}`
    );

    const data = targetVersion.data as Partial<NewKnowledgeNode>;
    const [updated] = await db
        .update(knowledgeNodes)
        .set({
            ...data,
            version: currentNode.version + 1,
            status: 'draft',
            updatedAt: new Date(),
        })
        .where(eq(knowledgeNodes.id, nodeId))
        .returning();

    return updated;
}

// ============ GENERATION JOBS ============
export async function createGenerationJob(
    data: Partial<typeof generationJobs.$inferInsert>
) {
    const [job] = await db.insert(generationJobs).values(data as any).returning();
    return job;
}

export async function updateGenerationJob(
    id: string,
    data: Partial<typeof generationJobs.$inferInsert>
) {
    const [job] = await db
        .update(generationJobs)
        .set(data as any)
        .where(eq(generationJobs.id, id))
        .returning();
    return job;
}

export async function getGenerationJobs(limit: number = 50) {
    return db
        .select()
        .from(generationJobs)
        .orderBy(desc(generationJobs.createdAt))
        .limit(limit);
}

export async function getGenerationJob(id: string) {
    const [job] = await db
        .select()
        .from(generationJobs)
        .where(eq(generationJobs.id, id))
        .limit(1);
    return job;
}

// ============ AUDIT LOG ============
export async function createAuditLog(data: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: object;
    newData?: object;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void> {
    await db.insert(auditLog).values(data);
}

export async function getAuditLogs(
    entityType?: string,
    entityId?: string,
    limit: number = 100
) {
    const conditions = [];

    if (entityType) {
        conditions.push(eq(auditLog.entityType, entityType));
    }
    if (entityId) {
        conditions.push(eq(auditLog.entityId, entityId));
    }

    return db
        .select({
            log: auditLog,
            user: users,
        })
        .from(auditLog)
        .leftJoin(users, eq(auditLog.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit);
}

// ============ SYLLABUS ============
export async function getSyllabus(module: string = 'ccna') {
    return db
        .select()
        .from(syllabus)
        .where(
            and(
                eq(syllabus.module, module as any),
                eq(syllabus.isActive, true)
            )
        )
        .orderBy(asc(syllabus.order));
}

export async function getTopics(module: string = 'ccna'): Promise<string[]> {
    const topics = await db
        .selectDistinct({ topic: knowledgeNodes.topic })
        .from(knowledgeNodes)
        .where(
            and(
                eq(knowledgeNodes.module, module as any),
                eq(knowledgeNodes.status, 'published'),
                sql`${knowledgeNodes.deletedAt} IS NULL`
            )
        )
        .orderBy(asc(knowledgeNodes.topic));

    return topics.map(t => t.topic);
}

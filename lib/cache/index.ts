import { kv } from '@vercel/kv';

const CACHE_PREFIX = 'ccna:';
const DEFAULT_TTL = 3600; // 1 hour

export interface CacheOptions {
    ttl?: number;
    tags?: string[];
}

export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const data = await kv.get<T>(`${CACHE_PREFIX}${key}`);
        return data;
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
}

export async function cacheSet<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
): Promise<void> {
    try {
        const { ttl = DEFAULT_TTL } = options;
        await kv.set(`${CACHE_PREFIX}${key}`, value, { ex: ttl });
    } catch (error) {
        console.error('Cache set error:', error);
    }
}

export async function cacheDelete(key: string): Promise<void> {
    try {
        await kv.del(`${CACHE_PREFIX}${key}`);
    } catch (error) {
        console.error('Cache delete error:', error);
    }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
    try {
        const keys = await kv.keys(`${CACHE_PREFIX}${pattern}*`);
        if (keys.length > 0) {
            await kv.del(...keys);
        }
    } catch (error) {
        console.error('Cache delete pattern error:', error);
    }
}

// Knowledge-specific cache functions
export async function getCachedKnowledge(intent: string, module: string = 'ccna') {
    const key = `knowledge:${module}:${normalizeIntent(intent)}`;
    return cacheGet(key);
}

export async function setCachedKnowledge(
    intent: string,
    module: string,
    data: unknown
): Promise<void> {
    const key = `knowledge:${module}:${normalizeIntent(intent)}`;
    await cacheSet(key, data, { ttl: 86400 }); // 24 hours
}

export async function invalidateKnowledgeCache(module: string = 'ccna'): Promise<void> {
    await cacheDeletePattern(`knowledge:${module}:`);
}

// Topic list cache
export async function getCachedTopics(module: string = 'ccna') {
    return cacheGet<string[]>(`topics:${module}`);
}

export async function setCachedTopics(module: string, topics: string[]): Promise<void> {
    await cacheSet(`topics:${module}`, topics, { ttl: 3600 });
}

// Syllabus cache
export async function getCachedSyllabus(module: string = 'ccna') {
    return cacheGet(`syllabus:${module}`);
}

export async function setCachedSyllabus(module: string, syllabus: unknown): Promise<void> {
    await cacheSet(`syllabus:${module}`, syllabus, { ttl: 3600 });
}

// Tutor response cache
export async function getCachedTutorResponse(query: string, module: string = 'ccna') {
    const key = `tutor:${module}:${normalizeIntent(query)}`;
    return cacheGet(key);
}

export async function setCachedTutorResponse(
    query: string,
    module: string,
    response: unknown
): Promise<void> {
    const key = `tutor:${module}:${normalizeIntent(query)}`;
    await cacheSet(key, response, { ttl: 3600 }); // 1 hour
}

function normalizeIntent(intent: string): string {
    return intent
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);
}

// Cache invalidation on publish/update/rollback
export async function invalidateOnPublish(module: string): Promise<void> {
    await Promise.all([
        invalidateKnowledgeCache(module),
        cacheDelete(`topics:${module}`),
        cacheDelete(`syllabus:${module}`),
        cacheDeletePattern(`tutor:${module}:`),
    ]);
}

// Simple in-memory rate limiter for development
// In production, use Redis or similar

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
};

const endpointConfigs: Record<string, RateLimitConfig> = {
    '/api/runtime/query': { windowMs: 60 * 1000, maxRequests: 30 },
    '/api/quiz/submit': { windowMs: 60 * 1000, maxRequests: 20 },
};

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

export async function rateLimit(
    identifier: string,
    endpoint: string
): Promise<RateLimitResult> {
    const config = endpointConfigs[endpoint] || defaultConfig;
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
        entry = {
            count: 0,
            resetAt: now + config.windowMs,
        };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const success = entry.count <= config.maxRequests;

    return {
        success,
        limit: config.maxRequests,
        remaining,
        reset: entry.resetAt,
    };
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
    return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
    };
}

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 1000);

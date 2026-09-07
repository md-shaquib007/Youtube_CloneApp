/**
 * High-performance Response Caching Middleware
 * Caches GET API JSON responses in memory with configurable TTL
 */

const cacheStore = new Map();

/**
 * Cache middleware with TTL in seconds
 */
export const cacheMiddleware = (ttlSeconds = 60) => {
    return (req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        const cacheKey = `${req.originalUrl || req.url}:${req.user?._id || "public"}`;
        const cachedItem = cacheStore.get(cacheKey);

        if (cachedItem && cachedItem.expiry > Date.now()) {
            res.setHeader("X-Cache", "HIT");
            return res.status(200).json(cachedItem.data);
        }

        const originalJson = res.json.bind(res);
        res.json = (data) => {
            if (res.statusCode === 200 && data && data.success) {
                cacheStore.set(cacheKey, {
                    data,
                    expiry: Date.now() + ttlSeconds * 1000,
                });
            }
            res.setHeader("X-Cache", "MISS");
            return originalJson(data);
        };

        next();
    };
};

/**
 * Invalidate cache entries matching key pattern or clear store
 */
export const clearCacheKey = (keyPattern) => {
    if (!keyPattern) {
        cacheStore.clear();
        return;
    }

    for (const key of cacheStore.keys()) {
        if (key.includes(keyPattern)) {
            cacheStore.delete(key);
        }
    }
};

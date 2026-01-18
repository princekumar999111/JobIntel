"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCache = setCache;
exports.getCache = getCache;
exports.clearCache = clearCache;
const cache = new Map();
function setCache(key, value, ttlSec = 300) {
    cache.set(key, { value, expireAt: Date.now() + ttlSec * 1000 });
}
function getCache(key) {
    const e = cache.get(key);
    if (!e)
        return null;
    if (Date.now() > e.expireAt) {
        cache.delete(key);
        return null;
    }
    return e.value;
}
function clearCache() {
    cache.clear();
}
exports.default = { setCache, getCache, clearCache };

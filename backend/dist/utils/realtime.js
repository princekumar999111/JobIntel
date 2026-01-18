"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishRealtime = publishRealtime;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || undefined;
let pubClient = null;
function getPubClient() {
    if (!REDIS_URL)
        return null;
    if (!pubClient) {
        pubClient = new ioredis_1.default(REDIS_URL);
        pubClient.on('error', (e) => console.warn('redis pub error', e?.message || e));
    }
    return pubClient;
}
function publishRealtime(channel, payload) {
    try {
        const client = getPubClient();
        if (!client)
            return; // Redis not configured — noop
        client.publish(channel, JSON.stringify(payload)).catch((err) => {
            console.warn('publishRealtime failed', err?.message || err);
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.warn('publishRealtime failed', err?.message || err);
    }
}
exports.default = publishRealtime;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || undefined;
const router = (0, express_1.Router)();
// Only admin can trigger bulk notifications for jobs
router.post("/send", auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), notificationController_1.sendNotification);
// Preview recipients without enqueuing
router.post('/preview', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), notificationController_1.previewNotification);
// Server-Sent Events stream for realtime notifications
router.get('/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();
    const channels = ['realtime:notifications', 'realtime:applications', 'realtime:users'];
    if (!REDIS_URL) {
        // Redis not configured: keep the SSE connection alive with pings
        const iv = setInterval(() => {
            try {
                res.write(': ping\n\n');
            }
            catch (e) { /* ignore */ }
        }, 15000);
        req.on('close', () => { clearInterval(iv); });
        return;
    }
    let sub = null;
    try {
        sub = new ioredis_1.default(REDIS_URL);
        sub.on('error', (e) => console.warn('redis sub error', e?.message || e));
        const onMessage = (_chan, message) => {
            try {
                res.write(`data: ${message}\n\n`);
            }
            catch (err) {
                // ignore
            }
        };
        await sub.subscribe(...channels);
        sub.on('message', onMessage);
        req.on('close', () => {
            sub && sub.removeListener('message', onMessage);
            // unsubscribe from all subscribed channels then disconnect
            sub && sub.unsubscribe(...channels).finally(() => sub && sub.disconnect());
        });
    }
    catch (e) {
        console.warn('Failed to setup Redis subscriber for SSE:', e?.message || e);
        // Fall back to periodic pings to keep connection alive
        const iv = setInterval(() => { try {
            res.write(': ping\n\n');
        }
        catch (err) { /* ignore */ } }, 15000);
        req.on('close', () => { clearInterval(iv); });
    }
});
exports.default = router;

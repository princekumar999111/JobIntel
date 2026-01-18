"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueNotification = enqueueNotification;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const notificationWorker_1 = require("../workers/notificationWorker");
const connection = process.env.REDIS_URL ? new ioredis_1.default(process.env.REDIS_URL) : null;
let notificationQueue = null;
if (connection) {
    notificationQueue = new bullmq_1.Queue("notifications", { connection });
}
async function enqueueNotification(payload) {
    if (notificationQueue) {
        await notificationQueue.add("send", payload, { attempts: 3, backoff: { type: "exponential", delay: 1000 } });
        return { queued: true };
    }
    // fallback: process inline
    await (0, notificationWorker_1.processNotificationInline)(payload);
    return { queued: false };
}
exports.default = notificationQueue;

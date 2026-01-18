"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNotificationInline = processNotificationInline;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const emailAdapter_1 = require("../notifications/emailAdapter");
const telegramAdapter_1 = require("../notifications/telegramAdapter");
const whatsappAdapter_1 = require("../notifications/whatsappAdapter");
const NotificationLog_1 = require("../models/NotificationLog");
const User_1 = require("../models/User");
const redisUrl = process.env.REDIS_URL;
async function attemptAdapters(payload) {
    const { toUserId, subject, text } = payload;
    const user = toUserId ? await User_1.User.findById(toUserId).lean() : null;
    const attempts = [];
    // Try email if user opts in
    if ((user && user.notificationPrefs?.email) || payload.preferredChannels?.includes("email")) {
        try {
            await (0, emailAdapter_1.sendEmail)(payload.toEmail || (user && user.email), subject || payload.title || "Notification", text || payload.body || "");
            attempts.push({ channel: "email", success: true });
        }
        catch (err) {
            attempts.push({ channel: "email", success: false, error: err?.message || err });
        }
    }
    // Telegram
    if ((user && user.notificationPrefs?.telegram) || payload.preferredChannels?.includes("telegram")) {
        try {
            await (0, telegramAdapter_1.sendTelegram)(payload.telegramChatId || (user && user.telegramId), text || payload.body || "");
            attempts.push({ channel: "telegram", success: true });
        }
        catch (err) {
            attempts.push({ channel: "telegram", success: false, error: err?.message || err });
        }
    }
    // WhatsApp
    if ((user && user.notificationPrefs?.whatsapp) || payload.preferredChannels?.includes("whatsapp")) {
        try {
            await (0, whatsappAdapter_1.sendWhatsApp)(payload.whatsappNumber || (user && user.phone), text || payload.body || "");
            attempts.push({ channel: "whatsapp", success: true });
        }
        catch (err) {
            attempts.push({ channel: "whatsapp", success: false, error: err?.message || err });
        }
    }
    // Persist log
    try {
        await NotificationLog_1.NotificationLog.create({ toUserId: toUserId || null, payload, attempts });
    }
    catch (e) {
        // ignore
    }
    return attempts;
}
async function processNotificationInline(payload) {
    return attemptAdapters(payload);
}
if (redisUrl) {
    const connection = new ioredis_1.default(redisUrl);
    new bullmq_1.QueueScheduler("notifications", { connection });
    const worker = new bullmq_1.Worker("notifications", async (job) => {
        await attemptAdapters(job.data);
    }, { connection });
    worker.on("failed", (job, err) => {
        // log failure
        // eslint-disable-next-line no-console
        console.error("notification job failed", job.id, err?.message || err);
    });
}

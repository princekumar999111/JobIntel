"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegram = sendTelegram;
async function sendTelegram(chatId, message) {
    // Placeholder: integrate with Telegram Bot API using TELEGRAM_BOT_TOKEN
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token)
        throw new Error("Telegram not configured");
    // simple fetch-based send would go here; for now simulate success
    return { ok: true, message: "simulated" };
}

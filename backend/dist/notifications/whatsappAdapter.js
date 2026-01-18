"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsApp = sendWhatsApp;
async function sendWhatsApp(to, message) {
    // Placeholder: integrate with WhatsApp Cloud API (Facebook) or Twilio
    const token = process.env.WHATSAPP_TOKEN;
    if (!token)
        throw new Error("WhatsApp not configured");
    // Simulate success for now
    return { ok: true };
}

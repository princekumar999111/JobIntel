"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.previewNotification = previewNotification;
exports.testEmail = testEmail;
exports.verifySmtp = verifySmtp;
const notificationQueue_1 = require("../queues/notificationQueue");
const Application_1 = require("../models/Application");
const User_1 = require("../models/User");
const emailAdapter_1 = require("../notifications/emailAdapter");
const mongoose_1 = __importDefault(require("mongoose"));
async function sendNotification(req, res) {
    try {
        const payload = req.body || {};
        // If jobId(s) specified, expand recipients to applicants of those job(s)
        const jobIds = [];
        if (payload.jobId)
            jobIds.push(payload.jobId);
        if (Array.isArray(payload.jobIds))
            jobIds.push(...payload.jobIds);
        if (jobIds.length > 0) {
            // find applications for these jobs and collect distinct userIds
            const objectIds = jobIds.map((j) => new mongoose_1.default.Types.ObjectId(j));
            const apps = await Application_1.Application.find({ jobId: { $in: objectIds } }).select('userId jobId').lean();
            const userIdSet = new Set();
            for (const a of apps) {
                if (a.userId)
                    userIdSet.add(a.userId.toString());
            }
            if (userIdSet.size === 0) {
                return res.status(200).json({ ok: true, queued: false, recipients: 0, message: 'No applicants found for provided job(s)' });
            }
            // enqueue for each recipient
            let enqueuedCount = 0;
            for (const uid of userIdSet) {
                // copy payload but set toUserId
                const individual = { ...payload, toUserId: uid, jobIds, jobId: jobIds.length === 1 ? jobIds[0] : undefined };
                await (0, notificationQueue_1.enqueueNotification)(individual);
                enqueuedCount++;
            }
            return res.json({ ok: true, queued: true, recipients: enqueuedCount });
        }
        // If targetAudience specified (all/free/premium/ultra), expand to matching users
        if (payload.targetAudience) {
            const ta = payload.targetAudience;
            const q = {};
            if (ta !== 'all')
                q.tier = ta;
            // only select _id to avoid pulling entire docs
            const users = await User_1.User.find(q).select('_id').lean();
            if (!users || users.length === 0) {
                return res.status(200).json({ ok: true, queued: false, recipients: 0, message: 'No users found for provided audience' });
            }
            let enqueuedCount = 0;
            const unique = new Set(users.map((u) => u._id.toString()));
            for (const uid of unique) {
                const individual = { ...payload, toUserId: uid };
                await (0, notificationQueue_1.enqueueNotification)(individual);
                enqueuedCount++;
            }
            return res.json({ ok: true, queued: true, recipients: enqueuedCount });
        }
        // fallback: enqueue single notification as provided (e.g., toUserId)
        const result = await (0, notificationQueue_1.enqueueNotification)(payload);
        return res.json({ ok: true, enqueued: result.queued });
    }
    catch (err) {
        return res.status(500).json({ error: "failed to enqueue notification", details: String(err) });
    }
}
// Preview recipients and samples without enqueuing
async function previewNotification(req, res) {
    try {
        const payload = req.body || {};
        const result = { recipients: 0, sample: [] };
        // job-based
        const jobIds = [];
        if (payload.jobId)
            jobIds.push(payload.jobId);
        if (Array.isArray(payload.jobIds))
            jobIds.push(...payload.jobIds);
        if (jobIds.length > 0) {
            const objectIds = jobIds.map((j) => new mongoose_1.default.Types.ObjectId(j));
            const apps = await Application_1.Application.find({ jobId: { $in: objectIds } }).select('userId jobId').lean();
            const userIds = Array.from(new Set(apps.map((a) => a.userId && a.userId.toString()).filter(Boolean)));
            result.recipients = userIds.length;
            // sample up to 5 users
            const sampleUsers = await mongoose_1.default.model('User').find({ _id: { $in: userIds.slice(0, 5) } }).select('email name').lean();
            result.sample = sampleUsers;
            return res.json(result);
        }
        // audience-based
        if (payload.targetAudience) {
            const ta = payload.targetAudience;
            const q = {};
            if (ta !== 'all')
                q.tier = ta;
            const users = await mongoose_1.default.model('User').find(q).select('_id email name').lean();
            result.recipients = users.length;
            result.sample = users.slice(0, 5);
            return res.json(result);
        }
        // fallback: specific toUserId
        if (payload.toUserId) {
            const u = await mongoose_1.default.model('User').findById(payload.toUserId).select('email name').lean();
            if (u) {
                result.recipients = 1;
                result.sample = [u];
            }
            return res.json(result);
        }
        // unknown/broadcast fallback: return 0 with message
        return res.json({ recipients: 0, sample: [] });
    }
    catch (err) {
        return res.status(500).json({ error: String(err) });
    }
}
// Admin test endpoint to send a single SMTP email
async function testEmail(req, res) {
    try {
        const { to, subject, message } = req.body || {};
        if (!to || !subject)
            return res.status(400).json({ error: 'to and subject are required' });
        await (0, emailAdapter_1.sendEmail)(to, subject, message || 'Test message from JobIntel');
        return res.json({ ok: true, message: 'Test email sent' });
    }
    catch (err) {
        return res.status(500).json({ error: String(err) });
    }
}
// Admin endpoint to verify SMTP connection/auth without sending
async function verifySmtp(req, res) {
    try {
        const ok = await (0, emailAdapter_1.verifySMTP)();
        return res.json({ ok: true, verified: !!ok });
    }
    catch (err) {
        return res.status(500).json({ ok: false, error: String(err) });
    }
}

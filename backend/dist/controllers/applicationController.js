"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApplication = createApplication;
exports.listApplications = listApplications;
exports.deleteApplication = deleteApplication;
const Application_1 = require("../models/Application");
const realtime_1 = require("../utils/realtime");
async function createApplication(req, res) {
    try {
        const payload = req.body;
        const a = await Application_1.Application.create(payload);
        try {
            const ev = {
                type: 'application_created',
                applicationId: a._id,
                jobId: a.jobId,
                userId: a.userId,
                createdAt: a.createdAt || new Date(),
            };
            (0, realtime_1.publishRealtime)('realtime:applications', ev);
        }
        catch (e) {
            console.warn('failed to publish application realtime event', e?.message || e);
        }
        return res.status(201).json(a);
    }
    catch (err) {
        return res.status(500).json({ error: "failed to create application", details: err });
    }
}
async function listApplications(req, res) {
    try {
        const q = {};
        if (req.query.jobId)
            q.jobId = req.query.jobId;
        if (req.query.userId)
            q.userId = req.query.userId;
        const items = await Application_1.Application.find(q).limit(100).lean();
        return res.json(items);
    }
    catch (err) {
        return res.status(500).json({ error: "failed to list applications", details: err });
    }
}
async function deleteApplication(req, res) {
    try {
        const app = await Application_1.Application.findByIdAndDelete(req.params.id).lean();
        if (!app)
            return res.status(404).json({ error: 'not found' });
        try {
            (0, realtime_1.publishRealtime)('realtime:applications', { type: 'application_deleted', applicationId: app._id, jobId: app.jobId, userId: app.userId });
        }
        catch (e) {
            console.warn('failed to publish application delete event', e?.message || e);
        }
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ error: 'failed to delete application', details: err });
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Application_1 = require("../models/Application");
const router = (0, express_1.Router)();
// Get recent activity for user
router.get("/recent", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const applications = await Application_1.Application.find({ userId })
            .populate('jobId', 'title company location')
            .lean()
            .limit(5)
            .sort({ createdAt: -1 });
        const activity = applications.map(app => ({
            id: app._id,
            type: 'application',
            title: `Applied to ${app.jobId?.title || 'Job'}`,
            company: app.jobId?.company || 'Company',
            location: app.jobId?.location || 'Remote',
            timestamp: app.createdAt,
            status: app.status,
        }));
        return res.json(activity);
    }
    catch (err) {
        return res.status(500).json({ error: err?.message || "Failed to get activity" });
    }
});
exports.default = router;

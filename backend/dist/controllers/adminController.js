"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = getAdminStats;
exports.getUserStats = getUserStats;
exports.getJobAnalytics = getJobAnalytics;
exports.getUserAnalytics = getUserAnalytics;
exports.getRevenueAnalytics = getRevenueAnalytics;
exports.getNotifications = getNotifications;
exports.listPendingJobs = listPendingJobs;
exports.approveJob = approveJob;
exports.revenueReport = revenueReport;
exports.auditLogs = auditLogs;
exports.gdprDeleteUser = gdprDeleteUser;
exports.runCrawlers = runCrawlers;
const Job_1 = require("../models/Job");
const Source_1 = require("../models/Source");
const AuditLog_1 = require("../models/AuditLog");
const playwrightScraper_1 = require("../services/playwrightScraper");
const Snapshot_1 = require("../models/Snapshot");
const deltaDetector_1 = require("../services/deltaDetector");
const NotificationLog_1 = require("../models/NotificationLog");
const Revenue_1 = require("../models/Revenue");
const User_1 = require("../models/User");
const Application_1 = require("../models/Application");
// Get dashboard statistics
async function getAdminStats(_req, res) {
    try {
        const totalJobs = await Job_1.Job.countDocuments();
        const activeJobs = await Job_1.Job.countDocuments({ status: 'published' });
        const pendingJobs = await Job_1.Job.countDocuments({ status: 'pending' });
        const totalApplications = await Job_1.Job.aggregate([
            { $group: { _id: null, total: { $sum: '$applicantsCount' } } }
        ]);
        const applicationsToday = await Job_1.Job.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        const notificationsSent = await NotificationLog_1.NotificationLog.countDocuments();
        // compute delivery stats
        const emailTotal = await NotificationLog_1.NotificationLog.countDocuments({ channel: 'email' });
        const emailSent = await NotificationLog_1.NotificationLog.countDocuments({ channel: 'email', status: 'sent' });
        const emailDelivery = emailTotal ? Number(((emailSent / emailTotal) * 100).toFixed(1)) : 0;
        const whatsappTotal = await NotificationLog_1.NotificationLog.countDocuments({ channel: 'whatsapp' });
        const whatsappSent = await NotificationLog_1.NotificationLog.countDocuments({ channel: 'whatsapp', status: 'sent' });
        const whatsappDelivery = whatsappTotal ? Number(((whatsappSent / whatsappTotal) * 100).toFixed(1)) : 0;
        const scheduledCount = await NotificationLog_1.NotificationLog.countDocuments({ status: 'scheduled' });
        res.json({
            totalJobs,
            activeJobs,
            pendingJobs,
            totalApplications: totalApplications[0]?.total || 0,
            applicationsToday,
            notificationsSent,
            emailDelivery,
            whatsappDelivery,
            scheduledCount,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
}
// Get user analytics with stats and recent users
async function getUserStats(_req, res) {
    try {
        const totalUsers = await User_1.User.countDocuments();
        const premiumUsers = await User_1.User.countDocuments({ tier: 'premium' });
        const freeUsers = totalUsers - premiumUsers;
        // Applications today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const applicationsToday = await Application_1.Application.countDocuments({
            createdAt: { $gte: today }
        });
        // Conversion rate (premium users / total users)
        const conversionRate = totalUsers > 0 ? Number(((premiumUsers / totalUsers) * 100).toFixed(1)) : 0;
        // Get recent users (last 20)
        const recentUsers = await User_1.User.find()
            .select('email name phone tier createdAt')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        // Count applications per user
        const userAppCounts = await Application_1.Application.aggregate([
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 }
                }
            }
        ]);
        const appCountMap = new Map(userAppCounts.map(doc => [doc._id?.toString(), doc.count]));
        // Get last active time for each user
        const userLastActive = await Application_1.Application.aggregate([
            {
                $group: {
                    _id: '$userId',
                    lastActive: { $max: '$createdAt' }
                }
            }
        ]);
        const lastActiveMap = new Map(userLastActive.map(doc => [doc._id?.toString(), doc.lastActive]));
        // Format recent users with application counts and last active
        const enrichedRecentUsers = recentUsers.map(user => ({
            id: user._id?.toString(),
            name: user.name || 'Unknown',
            email: user.email,
            phone: user.phone || undefined,
            tier: user.tier || 'free',
            joinedAt: new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            applications: appCountMap.get(user._id?.toString()) || 0,
            lastActive: formatLastActive(lastActiveMap.get(user._id?.toString())),
        }));
        // Get user growth over last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const freeCount = await User_1.User.countDocuments({
                tier: { $ne: 'premium' },
                createdAt: { $gte: date, $lt: nextDate }
            });
            const premiumCount = await User_1.User.countDocuments({
                tier: 'premium',
                createdAt: { $gte: date, $lt: nextDate }
            });
            last7Days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                free: freeCount,
                premium: premiumCount,
            });
        }
        res.json({
            stats: {
                totalUsers,
                premiumUsers,
                freeUsers,
                applicationsToday,
                conversionRate,
            },
            recentUsers: enrichedRecentUsers,
            growthData: last7Days,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error('User stats error:', err);
        res.status(500).json({ error: String(err) });
    }
}
// Helper function to format last active time
function formatLastActive(date) {
    if (!date)
        return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)
        return 'Just now';
    if (diffMins < 60)
        return `${diffMins} mins ago`;
    if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7)
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
// Get job analytics data
async function getJobAnalytics(_req, res) {
    try {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const posted = await Job_1.Job.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });
            last7Days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                posted,
            });
        }
        res.json(last7Days);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
}
// Get user analytics
async function getUserAnalytics(_req, res) {
    try {
        // Get last 6 months of data
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            const nextMonth = new Date(date);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const jobsCount = await Job_1.Job.countDocuments({
                createdAt: { $gte: date, $lt: nextMonth }
            });
            months.push({
                date: date.toLocaleDateString('en-US', { month: 'short' }),
                jobs: jobsCount,
            });
        }
        res.json(months);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
}
// Get revenue analytics
async function getRevenueAnalytics(_req, res) {
    try {
        // Get revenue data from the last 6 months
        const months = [];
        let totalRevenue = 0;
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            const nextMonth = new Date(date);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            // Get revenue from Revenue model
            const revenueData = await Revenue_1.Revenue.aggregate([
                {
                    $match: {
                        createdAt: { $gte: date, $lt: nextMonth },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]);
            const monthRevenue = revenueData[0]?.total || 0;
            const monthCount = revenueData[0]?.count || 0;
            totalRevenue += monthRevenue;
            months.push({
                date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                revenue: monthRevenue,
                transactionCount: monthCount,
            });
        }
        res.json({
            monthlyData: months,
            totalRevenue,
            averageMonthlyRevenue: totalRevenue / 6,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error('Revenue analytics error:', err);
        res.status(500).json({ error: String(err) });
    }
}
// Get notifications
async function getNotifications(_req, res) {
    try {
        const notifications = await NotificationLog_1.NotificationLog.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
}
async function listPendingJobs(_req, res) {
    const jobs = await Job_1.Job.find({ status: 'pending' }).lean();
    res.json(jobs);
}
async function approveJob(req, res) {
    const { id } = req.params;
    const job = await Job_1.Job.findByIdAndUpdate(id, { status: 'published' }, { new: true }).lean();
    if (!job)
        return res.status(404).json({ message: 'Not found' });
    await AuditLog_1.AuditLog.create({ actor: req.user?.email || 'system', action: 'approve_job', meta: { jobId: id } });
    res.json(job);
}
async function revenueReport(_req, res) {
    // Simple demo metrics
    const totalJobs = await Job_1.Job.countDocuments();
    const published = await Job_1.Job.countDocuments({ status: 'published' });
    const draft = await Job_1.Job.countDocuments({ status: 'draft' });
    // No billing model yet — return zeros
    res.json({ totalJobs, published, draft, totalRevenue: 0 });
}
async function auditLogs(_req, res) {
    const logs = await AuditLog_1.AuditLog.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json(logs);
}
async function gdprDeleteUser(req, res) {
    const { id } = req.params;
    // minimal deletion: remove user and related personal data (jobs/applications/referrals)
    const mongoose = require('mongoose');
    const User = mongoose.model('User');
    const Application = mongoose.model('Application');
    const Referral = mongoose.model('Referral');
    await User.findByIdAndDelete(id);
    await Application.deleteMany({ userId: id });
    await Referral.deleteMany({ userId: id });
    await AuditLog_1.AuditLog.create({ actor: req.user?.email || 'system', action: 'gdpr_delete', meta: { userId: id } });
    res.json({ ok: true });
}
async function runCrawlers(req, res) {
    const sources = await Source_1.Source.find({ enabled: true }).lean();
    const results = [];
    for (const s of sources) {
        try {
            const r = await (0, playwrightScraper_1.scrapeOnce)({ id: s._id?.toString(), url: s.url, selector: s.selector });
            // handle feed items if present
            if (r && Array.isArray(r.items)) {
                for (const item of r.items) {
                    const url = item.url || item.link;
                    const html = item.rawHtml || '';
                    const h = (0, deltaDetector_1.hashContent)(html);
                    const existing = await Snapshot_1.Snapshot.findOne({ url }).lean();
                    if (!existing || existing.hash !== h) {
                        // post to ingest endpoint by creating Job directly for admin-run
                        const job = await Job_1.Job.create({ title: item.title || 'Ingested', rawHtml: html, meta: { sourceId: s._id, sourceUrl: url } });
                        await Snapshot_1.Snapshot.findOneAndUpdate({ url }, { hash: h, lastSeen: new Date(), sourceId: s._id }, { upsert: true });
                        results.push({ url, created: job._id });
                    }
                }
            }
        }
        catch (e) {
            results.push({ source: s.url, error: String(e?.message || e) });
        }
    }
    await AuditLog_1.AuditLog.create({ actor: req.user?.email || 'system', action: 'run_crawlers', meta: { count: results.length } });
    res.json(results);
}

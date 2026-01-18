"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const authEnhanced_1 = require("../middleware/authEnhanced");
const router = (0, express_1.Router)();
// User-level analytics (requires authentication only)
router.get("/user-stats", authEnhanced_1.authenticateToken, analyticsController_1.getUserStats);
router.get("/job-match-trends", authEnhanced_1.authenticateToken, analyticsController_1.getJobMatchTrends);
router.get("/application-status", authEnhanced_1.authenticateToken, analyticsController_1.getApplicationStatus);
// Admin analytics (requires admin role)
router.use((0, authEnhanced_1.requireRole)("admin"));
// Get visitor analytics with time range
router.get("/visitors", analyticsController_1.getVisitorAnalytics);
// Get real-time visitor count
router.get("/realtime", analyticsController_1.getRealtimeVisitors);
// Get page-specific analytics
router.get("/pages", analyticsController_1.getPageAnalytics);
// Track custom events
router.post("/track-event", analyticsController_1.trackEvent);
// ==================== PHASE 5 ANALYTICS ROUTES ====================
// Admin-only analytics
router.use(authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)("admin"));
// Platform analytics
router.get("/platform/summary", analyticsController_1.getPlatformAnalyticsData);
router.get("/platform/dashboard", analyticsController_1.getAnalyticsDashboard);
router.get("/platform/trends", analyticsController_1.getAnalyticsTrends);
// Entity-specific analytics
router.get("/jobs/:jobId", analyticsController_1.getJobAnalyticsData);
// Top performers
router.get("/top-performers", analyticsController_1.getTopPerformers);
exports.default = router;

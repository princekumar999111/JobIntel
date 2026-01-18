import { Router } from "express";
import {
  getVisitorAnalytics,
  getRealtimeVisitors,
  getPageAnalytics,
  trackEvent,
  getUserStats,
  getJobMatchTrends,
  getApplicationStatus,
  getRecentActivity,
  getJobAnalyticsData,
  getPlatformAnalyticsData,
  getAnalyticsDashboard,
  getTopPerformers,
  getAnalyticsTrends,
} from "../controllers/analyticsController";
import { authenticateToken, requireRole } from "../middleware/authEnhanced";

const router = Router();

// User-level analytics (requires authentication only)
router.get("/user-stats", authenticateToken, getUserStats);
router.get("/job-match-trends", authenticateToken, getJobMatchTrends);
router.get("/application-status", authenticateToken, getApplicationStatus);

// Admin analytics (requires admin role)
router.use(requireRole("admin"));

// Get visitor analytics with time range
router.get("/visitors", getVisitorAnalytics);

// Get real-time visitor count
router.get("/realtime", getRealtimeVisitors);

// Get page-specific analytics
router.get("/pages", getPageAnalytics);

// Track custom events
router.post("/track-event", trackEvent);

// ==================== PHASE 5 ANALYTICS ROUTES ====================

// Admin-only analytics
router.use(authenticateToken, requireRole("admin"));

// Platform analytics
router.get("/platform/summary", getPlatformAnalyticsData);
router.get("/platform/dashboard", getAnalyticsDashboard);
router.get("/platform/trends", getAnalyticsTrends);

// Entity-specific analytics
router.get("/jobs/:jobId", getJobAnalyticsData);

// Top performers
router.get("/top-performers", getTopPerformers);

export default router;

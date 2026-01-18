"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobSearchController = __importStar(require("../controllers/jobSearchController"));
const adminScraperController = __importStar(require("../controllers/adminScraperController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ============================================
// PUBLIC & USER ROUTES - Job Search
// ============================================
/**
 * GET /api/jobs/search
 * Search and filter jobs
 * Query params: careerLevel, domain, role, techStack, employmentType, workMode, search, sortBy, page, limit
 */
router.get('/search', jobSearchController.searchJobs);
/**
 * GET /api/jobs/trending
 * Get trending jobs (most popular)
 * Query param: limit
 */
router.get('/trending', jobSearchController.getTrendingJobs);
/**
 * GET /api/jobs/fresh
 * Get fresh jobs (most recent)
 * Query param: limit
 */
router.get('/fresh', jobSearchController.getFreshJobs);
/**
 * GET /api/jobs/domain/:domain
 * Get jobs by specific domain (software, data, ai, cloud, etc)
 * Query params: page, limit
 */
router.get('/domain/:domain', jobSearchController.getJobsByDomain);
/**
 * GET /api/jobs/fresher
 * Get fresher-focused jobs (0-1 years experience)
 * Query params: page, limit
 */
router.get('/fresher', jobSearchController.getFresherJobs);
/**
 * GET /api/jobs/stats
 * Get job statistics
 */
router.get('/stats', jobSearchController.getJobStats);
/**
 * GET /api/jobs/:jobId
 * Get single job by ID
 */
router.get('/:jobId', jobSearchController.getJobById);
/**
 * POST /api/jobs/:jobId/applied
 * Mark job as applied
 * Auth: Required
 */
router.post('/:jobId/applied', auth_1.authenticateToken, jobSearchController.markJobAsApplied);
// ============================================
// ADMIN ROUTES - Job Scraping Management
// ============================================
/**
 * GET /api/admin/scraper/buckets
 * Get available role buckets
 * Query params: stats, priority (fresher|primary)
 * Auth: Admin required
 */
router.get('/admin/scraper/buckets', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminScraperController.getAvailableBuckets);
/**
 * GET /api/admin/scraper/buckets/:bucketId
 * Get specific bucket details
 * Auth: Admin required
 */
router.get('/admin/scraper/buckets/:bucketId', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminScraperController.getBucketDetails);
/**
 * GET /api/admin/scraper/usage
 * Check API usage limits
 * Auth: Admin required
 */
router.get('/admin/scraper/usage', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminScraperController.checkAPIUsage);
/**
 * POST /api/admin/scraper/buckets/:bucketId
 * Scrape a specific role bucket
 * Auth: Admin required
 */
router.post('/admin/scraper/buckets/:bucketId', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminScraperController.scrapeBucket);
/**
 * POST /api/admin/scraper/fresher-priority
 * Scrape fresher-priority buckets
 * Auth: Admin required
 */
router.post('/admin/scraper/fresher-priority', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminScraperController.scrapeFresherPriority);
/**
 * POST /api/admin/scraper/all-buckets
 * Scrape all buckets
 * Auth: Admin required
 */
router.post('/admin/scraper/all-buckets', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminScraperController.scrapeAllBuckets);
/**
 * GET /api/admin/scraper/history
 * Get scraping history and API usage summary
 * Auth: Admin required
 */
router.get('/admin/scraper/history', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), adminScraperController.getScrapingHistory);
/**
 * POST /api/admin/jobs/cleanup
 * Cleanup expired jobs
 * Auth: Admin required
 */
router.post('/admin/jobs/cleanup', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), jobSearchController.cleanupExpiredJobs);
exports.default = router;

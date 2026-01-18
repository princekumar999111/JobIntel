import express, { Router } from 'express';
import * as jobSearchController from '../controllers/jobSearchController';
import * as adminScraperController from '../controllers/adminScraperController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

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
router.post('/:jobId/applied', authenticateToken, jobSearchController.markJobAsApplied);

// ============================================
// ADMIN ROUTES - Job Scraping Management
// ============================================

/**
 * GET /api/admin/scraper/buckets
 * Get available role buckets
 * Query params: stats, priority (fresher|primary)
 * Auth: Admin required
 */
router.get('/admin/scraper/buckets', authenticateToken, requireRole('admin'), adminScraperController.getAvailableBuckets);

/**
 * GET /api/admin/scraper/buckets/:bucketId
 * Get specific bucket details
 * Auth: Admin required
 */
router.get('/admin/scraper/buckets/:bucketId', authenticateToken, requireRole('admin'), adminScraperController.getBucketDetails);

/**
 * GET /api/admin/scraper/usage
 * Check API usage limits
 * Auth: Admin required
 */
router.get('/admin/scraper/usage', authenticateToken, requireRole('admin'), adminScraperController.checkAPIUsage);

/**
 * POST /api/admin/scraper/buckets/:bucketId
 * Scrape a specific role bucket
 * Auth: Admin required
 */
router.post('/admin/scraper/buckets/:bucketId', authenticateToken, requireRole('admin'), adminScraperController.scrapeBucket);

/**
 * POST /api/admin/scraper/fresher-priority
 * Scrape fresher-priority buckets
 * Auth: Admin required
 */
router.post('/admin/scraper/fresher-priority', authenticateToken, requireRole('admin'), adminScraperController.scrapeFresherPriority);

/**
 * POST /api/admin/scraper/all-buckets
 * Scrape all buckets
 * Auth: Admin required
 */
router.post('/admin/scraper/all-buckets', authenticateToken, requireRole('admin'), adminScraperController.scrapeAllBuckets);

/**
 * GET /api/admin/scraper/history
 * Get scraping history and API usage summary
 * Auth: Admin required
 */
router.get('/admin/scraper/history', authenticateToken, requireRole('admin'), adminScraperController.getScrapingHistory);

/**
 * POST /api/admin/jobs/cleanup
 * Cleanup expired jobs
 * Auth: Admin required
 */
router.post('/admin/jobs/cleanup', authenticateToken, requireRole('admin'), jobSearchController.cleanupExpiredJobs);

export default router;

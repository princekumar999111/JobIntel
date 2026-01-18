import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getScraperConfig,
  updateScraperConfig,
  updateRateLimits,
  updateBudgetSettings,
  updateAutoScrapeSchedule,
  updateCompanyFilters,
  updateDataQualityFilters,
  getScraperCostSummary,
  testScraperConfig,
} from '../controllers/scraperConfigController';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireRole('admin'));

// Get current scraper configuration
router.get('/config', getScraperConfig);

// Update full configuration
router.put('/config', updateScraperConfig);

// Update specific settings
router.put('/rate-limits', updateRateLimits);
router.put('/budget', updateBudgetSettings);
router.put('/schedule', updateAutoScrapeSchedule);
router.put('/company-filters', updateCompanyFilters);
router.put('/data-quality', updateDataQualityFilters);

// Get cost summary
router.get('/cost-summary', getScraperCostSummary);

// Test configuration
router.get('/test', testScraperConfig);

export default router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const scraperConfigController_1 = require("../controllers/scraperConfigController");
const router = express_1.default.Router();
// All routes require admin authentication
router.use(auth_1.authenticateToken, (0, auth_1.requireRole)('admin'));
// Get current scraper configuration
router.get('/config', scraperConfigController_1.getScraperConfig);
// Update full configuration
router.put('/config', scraperConfigController_1.updateScraperConfig);
// Update specific settings
router.put('/rate-limits', scraperConfigController_1.updateRateLimits);
router.put('/budget', scraperConfigController_1.updateBudgetSettings);
router.put('/schedule', scraperConfigController_1.updateAutoScrapeSchedule);
router.put('/company-filters', scraperConfigController_1.updateCompanyFilters);
router.put('/data-quality', scraperConfigController_1.updateDataQualityFilters);
// Get cost summary
router.get('/cost-summary', scraperConfigController_1.getScraperCostSummary);
// Test configuration
router.get('/test', scraperConfigController_1.testScraperConfig);
exports.default = router;

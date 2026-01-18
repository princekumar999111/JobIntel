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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openWebNinjaService_1 = __importDefault(require("../services/openWebNinjaService"));
const auth_1 = require("../middleware/auth");
const linkedinScraperController = __importStar(require("../controllers/linkedinScraperController"));
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)('jobintel:scraper-routes');
const router = express_1.default.Router();
// ===== INDIA-FOCUSED LINKEDIN JOB SCRAPER ENDPOINTS =====
/**
 * GET /api/scraper/presets
 * Get all preset searches (India-focused)
 */
router.get('/presets', linkedinScraperController.getPresetSearches);
/**
 * GET /api/scraper/locations
 * Get all available Indian locations
 */
router.get('/locations', linkedinScraperController.getLocations);
/**
 * GET /api/scraper/experience-levels
 * Get experience level options
 */
router.get('/experience-levels', linkedinScraperController.getExperienceLevels);
/**
 * GET /api/scraper/employment-types
 * Get employment type options
 */
router.get('/employment-types', linkedinScraperController.getEmploymentTypes);
/**
 * GET /api/scraper/trending
 * Get trending jobs across India
 */
router.get('/trending', linkedinScraperController.getTrendingJobs);
/**
 * GET /api/scraper/salary
 * Get salary insights for a position and location in India
 * Query: position, location, experienceLevel
 */
router.get('/salary', linkedinScraperController.getSalaryInsights);
/**
 * POST /api/scraper/preset-search
 * Run one of the preset searches
 * Body: { presetId: number, pages?: number }
 */
router.post('/preset-search', linkedinScraperController.runPresetSearch);
/**
 * POST /api/scraper/advanced-search
 * Advanced job search with custom filters
 * Body: { keyword, location, employmentType, datePosted, remote, experienceLevel, pages }
 */
router.post('/advanced-search', linkedinScraperController.advancedSearch);
/**
 * POST /api/scraper/company-search
 * Search jobs by company name
 * Body: { company, location? }
 */
router.post('/company-search', linkedinScraperController.searchByCompany);
/**
 * GET /api/scraper/history
 * Get user's search history (Protected)
 */
router.get('/history', auth_1.authenticateToken, linkedinScraperController.getSearchHistory);
/**
 * GET /api/scraper/results/:searchId
 * Get results from a specific search (Protected)
 */
router.get('/results/:searchId', auth_1.authenticateToken, linkedinScraperController.getSearchResults);
/**
 * POST /api/scraper/export/:searchId
 * Export search results to CSV or JSON (Protected)
 */
router.post('/export/:searchId', auth_1.authenticateToken, linkedinScraperController.exportJobsToCSV);
/**
 * POST /api/scraper/export-all
 * Bulk export all user searches (Protected)
 */
router.post('/export-all', auth_1.authenticateToken, linkedinScraperController.bulkExportSearches);
/**
 * POST /api/scraper/export-salary
 * Export salary data (Protected)
 */
router.post('/export-salary', auth_1.authenticateToken, linkedinScraperController.exportSalaryData);
/**
 * GET /api/scraper/salary-report
 * Get salary comparison report
 */
router.get('/salary-report', linkedinScraperController.getSalaryReport);
// ===== LEGACY ENDPOINTS (Keep for backward compatibility) =====
/**
 * POST /api/scraper/search
 * Search for jobs on LinkedIn via OpenWeb Ninja
 */
router.post('/search', async (req, res) => {
    try {
        const { query, country = 'India', page = 1, num_pages = 1, employment_type, date_posted, remote_jobs_only = false, } = req.body;
        log(`🔍 Job search: ${query} in ${country}`);
        const result = await openWebNinjaService_1.default.searchJobs({
            query,
            country,
            page,
            num_pages,
            employment_type,
            date_posted,
            remote_jobs_only,
        });
        res.json({
            success: true,
            data: result.data,
            count: result.data?.length || 0,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        log(`❌ Search error: ${error.message}`);
        res.status(400).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
/**
 * GET /api/scraper/job/:jobId
 * Get detailed job information
 */
router.get('/job/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        log(`📋 Getting job details: ${jobId}`);
        const result = await openWebNinjaService_1.default.getJobDetails(jobId);
        res.json({
            success: true,
            data: result.data,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        log(`❌ Job details error: ${error.message}`);
        res.status(400).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
/**
 * POST /api/scraper/salary
 * Query salary information
 */
router.post('/salary', async (req, res) => {
    try {
        const { job_title, location, experience_level, company, } = req.body;
        log(`💰 Salary query: ${job_title} in ${location}`);
        const result = await openWebNinjaService_1.default.querySalary({
            job_title,
            location,
            experience_level,
            company,
        });
        res.json({
            success: true,
            data: result.data,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        log(`❌ Salary query error: ${error.message}`);
        res.status(400).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;

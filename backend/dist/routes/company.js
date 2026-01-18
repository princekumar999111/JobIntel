"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companyController_1 = require("../controllers/companyController");
const authEnhanced_1 = require("../middleware/authEnhanced");
const router = (0, express_1.Router)();
// Admin-only endpoints
router.use(authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)('admin'));
// List all companies with pagination and filters
router.get("/", companyController_1.listCompanies);
// Get company statistics
router.get("/stats/summary", companyController_1.getCompanyStatistics);
// Get single company
router.get("/:id", companyController_1.getCompany);
// Get company analytics
router.get("/:id/analytics", companyController_1.getCompanyAnalytics);
// Create new company
router.post("/", companyController_1.createCompany);
// Update company details
router.put("/:id", companyController_1.updateCompany);
// Verify company (approve or reject)
router.put("/:id/verify", companyController_1.verifyCompany);
// Update scraping metrics
router.put("/:id/metrics", companyController_1.updateScrapingMetrics);
// Toggle blacklist status
router.put("/:id/blacklist", companyController_1.toggleBlacklist);
// Delete company
router.delete("/:id", companyController_1.deleteCompany);
// Bulk import companies
router.post("/bulk/import", companyController_1.bulkImportCompanies);
exports.default = router;

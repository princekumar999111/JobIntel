import { Router } from "express";
import {
  createCompany,
  getCompany,
  listCompanies,
  updateCompany,
  verifyCompany,
  toggleBlacklist,
  deleteCompany,
  bulkImportCompanies,
  getCompanyAnalytics,
  getCompanyStatistics,
  updateScrapingMetrics
} from "../controllers/companyController";
import { authenticateToken, requireRole } from "../middleware/authEnhanced";

const router = Router();

// Admin-only endpoints
router.use(authenticateToken, requireRole('admin'));

// List all companies with pagination and filters
router.get("/", listCompanies);

// Get company statistics
router.get("/stats/summary", getCompanyStatistics);

// Get single company
router.get("/:id", getCompany);

// Get company analytics
router.get("/:id/analytics", getCompanyAnalytics);

// Create new company
router.post("/", createCompany);

// Update company details
router.put("/:id", updateCompany);

// Verify company (approve or reject)
router.put("/:id/verify", verifyCompany);

// Update scraping metrics
router.put("/:id/metrics", updateScrapingMetrics);

// Toggle blacklist status
router.put("/:id/blacklist", toggleBlacklist);

// Delete company
router.delete("/:id", deleteCompany);

// Bulk import companies
router.post("/bulk/import", bulkImportCompanies);

export default router;


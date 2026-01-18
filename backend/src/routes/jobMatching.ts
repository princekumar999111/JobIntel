import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/authEnhanced";
import {
  getJobMatchingConfig,
  updateJobMatchingConfig,
  createMatchingProfile,
  getMatchingProfiles,
  updateMatchingProfile,
  deleteMatchingProfile,
  setDefaultProfile,
  getAlgorithmStatistics,
  updateAlgorithmWeights,
  testMatchingConfig,
} from "../controllers/jobMatchingController";

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, requireRole("admin"));

// Global configuration
router.get("/config", getJobMatchingConfig);
router.put("/config", updateJobMatchingConfig);

// Algorithm statistics
router.get("/stats/summary", getAlgorithmStatistics);

// Algorithm weights
router.put("/algorithm/weights", updateAlgorithmWeights);

// Matching profiles CRUD
router.get("/profiles", getMatchingProfiles);
router.post("/profiles", createMatchingProfile);
router.put("/profiles/:profileId", updateMatchingProfile);
router.delete("/profiles/:profileId", deleteMatchingProfile);

// Set default profile
router.post("/profiles/default/set", setDefaultProfile);

// Test configuration
router.post("/test", testMatchingConfig);

export default router;

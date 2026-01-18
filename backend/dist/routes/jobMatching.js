"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authEnhanced_1 = require("../middleware/authEnhanced");
const jobMatchingController_1 = require("../controllers/jobMatchingController");
const router = (0, express_1.Router)();
// All routes require admin authentication
router.use(authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)("admin"));
// Global configuration
router.get("/config", jobMatchingController_1.getJobMatchingConfig);
router.put("/config", jobMatchingController_1.updateJobMatchingConfig);
// Algorithm statistics
router.get("/stats/summary", jobMatchingController_1.getAlgorithmStatistics);
// Algorithm weights
router.put("/algorithm/weights", jobMatchingController_1.updateAlgorithmWeights);
// Matching profiles CRUD
router.get("/profiles", jobMatchingController_1.getMatchingProfiles);
router.post("/profiles", jobMatchingController_1.createMatchingProfile);
router.put("/profiles/:profileId", jobMatchingController_1.updateMatchingProfile);
router.delete("/profiles/:profileId", jobMatchingController_1.deleteMatchingProfile);
// Set default profile
router.post("/profiles/default/set", jobMatchingController_1.setDefaultProfile);
// Test configuration
router.post("/test", jobMatchingController_1.testMatchingConfig);
exports.default = router;

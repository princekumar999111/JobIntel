"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resumeController_1 = require("../controllers/resumeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All resume endpoints require authentication
router.use(auth_1.authenticateToken);
/**
 * POST /api/resume/upload
 * Upload and process resume (PDF or DOCX)
 */
router.post("/upload", resumeController_1.upload.single("resume"), resumeController_1.uploadResume);
/**
 * GET /api/resume/status
 * Get resume upload status for authenticated user
 */
router.get("/status", resumeController_1.getResumeStatus);
/**
 * GET /api/resume/matching-jobs
 * Get all jobs matching user's resume (sorted by match score)
 * Query params: minScore (default 70)
 */
router.get("/matching-jobs", resumeController_1.getMatchingJobs);
/**
 * GET /api/resume/download
 * Download user's resume
 */
router.get("/download", resumeController_1.downloadResume);
/**
 * DELETE /api/resume/:id
 * Delete user's resume
 */
router.delete("/:id", resumeController_1.deleteResume);
exports.default = router;

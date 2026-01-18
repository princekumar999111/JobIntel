"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiController_1 = require("../controllers/aiController");
const auth_1 = require("../middleware/auth");
const jobEmbeddingService_1 = require("../services/jobEmbeddingService");
const matchingEngine_1 = require("../services/matchingEngine");
const router = express_1.default.Router();
router.post('/parse', aiController_1.parseJobController);
router.post('/match', aiController_1.matchController);
router.post('/cover', aiController_1.coverController);
/**
 * POST /api/ai/job-embedding/:jobId
 * Admin endpoint to manually trigger job embedding (useful for re-embedding)
 * Requires admin role
 */
router.post('/job-embedding/:jobId', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const { jobId } = req.params;
        console.log(`Admin triggered embedding for job ${jobId}`);
        const { embedding, matches } = await (0, jobEmbeddingService_1.generateJobEmbedding)(jobId);
        // Trigger notifications for matching users
        if (matches && matches.length > 0) {
            try {
                await (0, jobEmbeddingService_1.triggerJobMatchNotifications)(jobId, matches);
            }
            catch (notifErr) {
                console.error('Error triggering match notifications:', notifErr);
            }
        }
        return res.json({
            success: true,
            jobId,
            matchCount: matches?.length || 0,
            embeddingDimensions: embedding.length,
        });
    }
    catch (error) {
        console.error('Error embedding job:', error);
        return res.status(500).json({
            error: 'Failed to embed job',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * GET /api/ai/job-matches/:userId
 * Get all job matches for a user with their resume
 * Requires authentication
 */
router.get('/job-matches/:userId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = req.user;
        // Users can only see their own matches, admins can see any
        if (user._id.toString() !== userId && !user.roles?.includes('admin')) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const minScore = parseInt(req.query.minScore) || 70;
        const matches = await (0, matchingEngine_1.getUserMatchingJobs)(userId, minScore);
        return res.json({
            userId,
            minScore,
            matchCount: matches.length,
            matches,
        });
    }
    catch (error) {
        console.error('Error getting job matches:', error);
        return res.status(500).json({
            error: 'Failed to get job matches',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.default = router;

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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authEnhanced_1 = require("../middleware/authEnhanced");
const recommendationController_1 = require("../controllers/recommendationController");
const router = (0, express_1.Router)();
// User routes - accessible to logged-in users
// Get personalized job recommendations
router.get('/jobs/recommendations/:userId', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        await (0, recommendationController_1.getJobRecommendations)(req, res);
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get skill gap analysis for target role
router.get('/skill-gap/:userId/:targetRole', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        await (0, recommendationController_1.getSkillGapAnalysis)(req, res);
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get career path planning
router.get('/career-path/:userId', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        await (0, recommendationController_1.getCareerPath)(req, res);
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get recommendation insights
router.get('/insights/:userId', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        await (0, recommendationController_1.getRecommendationInsights)(req, res);
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update user recommendation preferences
router.put('/preferences/:userId', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        await (0, recommendationController_1.updateRecommendationPreferences)(req, res);
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Record recommendation feedback (click, apply, etc)
router.post('/feedback/:userId/:recommendationId', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        await (0, recommendationController_1.recordRecommendationFeedback)(req, res);
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Admin routes - for analytics and monitoring
// Get all recommendations for a user (admin only)
router.get('/admin/all/:userId', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)('admin'), async (req, res) => {
    try {
        const { JobRecommendation } = await Promise.resolve().then(() => __importStar(require('../models/Recommendation')));
        const recommendations = await JobRecommendation.find({ userId: req.params.userId })
            .sort({ recommendedAt: -1 })
            .limit(100);
        res.json({
            userId: req.params.userId,
            count: recommendations.length,
            recommendations
        });
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get skill gap analysis for all users (admin only)
router.get('/admin/skill-gaps', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)('admin'), async (req, res) => {
    try {
        const { SkillGapAnalysis } = await Promise.resolve().then(() => __importStar(require('../models/Recommendation')));
        const analyses = await SkillGapAnalysis.find()
            .sort({ updatedAt: -1 })
            .limit(50)
            .populate('userId', 'email profile');
        res.json({
            count: analyses.length,
            analyses
        });
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get career paths for all users (admin only)
router.get('/admin/career-paths', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)('admin'), async (req, res) => {
    try {
        const { CareerPath } = await Promise.resolve().then(() => __importStar(require('../models/Recommendation')));
        const paths = await CareerPath.find()
            .sort({ pathUpdatedAt: -1 })
            .limit(50)
            .populate('userId', 'email profile');
        res.json({
            count: paths.length,
            paths
        });
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get recommendation insights aggregated (admin only)
router.get('/admin/insights', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)('admin'), async (req, res) => {
    try {
        const { RecommendationInsight } = await Promise.resolve().then(() => __importStar(require('../models/Recommendation')));
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const insights = await RecommendationInsight.find({
            insightGeneratedAt: { $gte: weekAgo }
        }).sort({ insightGeneratedAt: -1 });
        const aggregated = {
            totalInsights: insights.length,
            avgClickThroughRate: Math.round(insights.reduce((sum, i) => sum + i.clickThroughRate, 0) / insights.length),
            avgConversionRate: Math.round(insights.reduce((sum, i) => sum + i.conversionRate, 0) / insights.length),
            totalRecommendationsGiven: insights.reduce((sum, i) => sum + i.recommendationsReceived, 0),
            totalApplications: insights.reduce((sum, i) => sum + i.applicationsFromRecommendations, 0),
            enginePerformance: 'optimal'
        };
        res.json(aggregated);
    }
    catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

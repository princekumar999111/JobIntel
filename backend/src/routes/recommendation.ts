import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/authEnhanced';
import {
  getJobRecommendations,
  getSkillGapAnalysis,
  getCareerPath,
  getRecommendationInsights,
  updateRecommendationPreferences,
  recordRecommendationFeedback
} from '../controllers/recommendationController';

const router = Router();

// User routes - accessible to logged-in users
// Get personalized job recommendations
router.get('/jobs/recommendations/:userId', authenticateToken, async (req: any, res: Response) => {
  try {
    await getJobRecommendations(req, res);
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get skill gap analysis for target role
router.get('/skill-gap/:userId/:targetRole', authenticateToken, async (req: any, res: Response) => {
  try {
    await getSkillGapAnalysis(req, res);
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get career path planning
router.get('/career-path/:userId', authenticateToken, async (req: any, res: Response) => {
  try {
    await getCareerPath(req, res);
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recommendation insights
router.get('/insights/:userId', authenticateToken, async (req: any, res: Response) => {
  try {
    await getRecommendationInsights(req, res);
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user recommendation preferences
router.put('/preferences/:userId', authenticateToken, async (req: any, res: Response) => {
  try {
    await updateRecommendationPreferences(req, res);
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record recommendation feedback (click, apply, etc)
router.post('/feedback/:userId/:recommendationId', authenticateToken, async (req: any, res: Response) => {
  try {
    await recordRecommendationFeedback(req, res);
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes - for analytics and monitoring
// Get all recommendations for a user (admin only)
router.get('/admin/all/:userId', authenticateToken, requireRole('admin'), async (req: any, res: Response) => {
  try {
    const { JobRecommendation } = await import('../models/Recommendation');
    const recommendations = await JobRecommendation.find({ userId: req.params.userId })
      .sort({ recommendedAt: -1 })
      .limit(100);
    
    res.json({
      userId: req.params.userId,
      count: recommendations.length,
      recommendations
    });
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get skill gap analysis for all users (admin only)
router.get('/admin/skill-gaps', authenticateToken, requireRole('admin'), async (req: any, res: Response) => {
  try {
    const { SkillGapAnalysis } = await import('../models/Recommendation');
    const analyses = await SkillGapAnalysis.find()
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('userId', 'email profile');
    
    res.json({
      count: analyses.length,
      analyses
    });
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get career paths for all users (admin only)
router.get('/admin/career-paths', authenticateToken, requireRole('admin'), async (req: any, res: Response) => {
  try {
    const { CareerPath } = await import('../models/Recommendation');
    const paths = await CareerPath.find()
      .sort({ pathUpdatedAt: -1 })
      .limit(50)
      .populate('userId', 'email profile');
    
    res.json({
      count: paths.length,
      paths
    });
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recommendation insights aggregated (admin only)
router.get('/admin/insights', authenticateToken, requireRole('admin'), async (req: any, res: Response) => {
  try {
    const { RecommendationInsight } = await import('../models/Recommendation');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const insights = await RecommendationInsight.find({
      insightGeneratedAt: { $gte: weekAgo }
    }).sort({ insightGeneratedAt: -1 });

    const aggregated = {
      totalInsights: insights.length,
      avgClickThroughRate: Math.round(insights.reduce((sum: any, i: any) => sum + i.clickThroughRate, 0) / insights.length),
      avgConversionRate: Math.round(insights.reduce((sum: any, i: any) => sum + i.conversionRate, 0) / insights.length),
      totalRecommendationsGiven: insights.reduce((sum: any, i: any) => sum + i.recommendationsReceived, 0),
      totalApplications: insights.reduce((sum: any, i: any) => sum + i.applicationsFromRecommendations, 0),
      enginePerformance: 'optimal'
    };

    res.json(aggregated);
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

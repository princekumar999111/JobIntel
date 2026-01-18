import { Request, Response } from 'express';
import { JobRecommendation, SkillGapAnalysis, CareerPath, UserRecommendationPreference, RecommendationInsight } from '../models/Recommendation';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { JobMatchingConfig } from '../models/JobMatchingConfig';
import { AdminActivityLog } from '../models/AdminActivityLog';

// Get personalized job recommendations for user
export const getJobRecommendations = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10, algorithm = 'hybrid' } = req.query;

    // Validate input
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get user data
    const user = await User.findById(userId).select('skills parsedResumeData expectedSalary location');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user preferences
    const preferences = await UserRecommendationPreference.findOne({ userId });

    // Calculate match scores using different algorithms
    const allJobs = await Job.find({ status: 'active' }).populate('companyId').limit(500);

    const recommendations = allJobs.map((job: any) => {
      // Calculate individual match scores
      const skillMatch = calculateSkillMatch(user.skills || user.parsedResumeData?.parsedSkills || [], job.requiredSkills || []);
      const experienceMatch = calculateExperienceMatch(user.parsedResumeData?.parsedProfile?.yearsOfExperience || 0, job.experienceRequired);
      const salaryMatch = calculateSalaryMatch(preferences?.salaryRange || { min: 0, max: 1000000 }, job.salary);
      const locationMatch = calculateLocationMatch(preferences?.preferredLocations || [], job.location);
      const careerGrowth = calculateCareerGrowthMatch(job.careerGrowth || 0);

      // Aggregate scores based on algorithm
      let matchScore = 0;
      if (algorithm === 'content-based') {
        matchScore = (skillMatch * 0.4 + experienceMatch * 0.25 + salaryMatch * 0.15 + locationMatch * 0.1 + careerGrowth * 0.1);
      } else if (algorithm === 'collaborative') {
        matchScore = (skillMatch * 0.3 + experienceMatch * 0.3 + salaryMatch * 0.2 + locationMatch * 0.1 + careerGrowth * 0.1);
      } else {
        // Hybrid
        matchScore = (skillMatch * 0.35 + experienceMatch * 0.28 + salaryMatch * 0.17 + locationMatch * 0.1 + careerGrowth * 0.1);
      }

      const confidenceLevel = Math.min(1, matchScore / 100);

      return {
        jobId: job._id,
        companyId: job.companyId._id,
        matchScore: Math.round(matchScore),
        matchReasoning: {
          skillMatch: Math.round(skillMatch),
          experienceMatch: Math.round(experienceMatch),
          salaryMatch: Math.round(salaryMatch),
          locationMatch: Math.round(locationMatch),
          careerGrowth: Math.round(careerGrowth)
        },
        algorithmType: algorithm,
        confidenceLevel: Math.round(confidenceLevel * 100) / 100,
        jobTitle: job.title,
        companyName: job.companyId.name,
        salary: job.salary,
        location: job.location
      };
    }).filter((rec: any) => rec.matchScore >= 40).sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, parseInt(limit as string));

    // Save recommendations to database
    for (const rec of recommendations) {
      await JobRecommendation.create({
        userId,
        jobId: rec.jobId,
        companyId: rec.companyId,
        matchScore: rec.matchScore,
        matchReasoning: rec.matchReasoning,
        algorithmType: algorithm,
        confidenceLevel: rec.confidenceLevel
      });
    }

    console.log(`Generated ${recommendations.length} job recommendations for user ${userId}`);

    res.json({
      userId,
      recommendationsCount: recommendations.length,
      algorithm,
      recommendations
    });
  } catch (error: any) {
    console.error('Error fetching job recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations', details: error.message });
  }
};

// Get skill gap analysis for user targeting a role
export const getSkillGapAnalysis = async (req: any, res: Response) => {
  try {
    const { userId, targetRole } = req.params;

    if (!userId || !targetRole) {
      return res.status(400).json({ error: 'userId and targetRole are required' });
    }

    // Get user current skills
    const user = await User.findById(userId).select('skills parsedResumeData');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentSkills = user.skills || [];

    // Get target role requirements from job market data
    const targetJobs = await Job.find({ title: new RegExp(targetRole, 'i') }).select('requiredSkills').limit(50);
    
    // Aggregate required skills
    const requiredSkillsMap = new Map<string, { count: number; priority: string }>();
    targetJobs.forEach((job: any) => {
      (job.requiredSkills || []).forEach((skill: string | any) => {
        const key = typeof skill === 'string' ? skill.toLowerCase() : (skill.name?.toLowerCase() || '');
        if (key) {
          const existing = requiredSkillsMap.get(key) || { count: 0, priority: 'medium' };
          requiredSkillsMap.set(key, { count: existing.count + 1, priority: existing.count > 25 ? 'critical' : 'high' });
        }
      });
    });

    // Calculate skill gaps
    const skillGaps = Array.from(requiredSkillsMap.entries()).map(([skill, data]) => {
      const hasSkill = currentSkills.some((s: string) => s.toLowerCase() === skill);
      const currentLevel = hasSkill ? 3 : 0;
      const requiredLevel = data.priority === 'critical' ? 4 : 3;
      const gap = Math.max(0, requiredLevel - currentLevel);

      return {
        skill,
        currentLevel,
        requiredLevel,
        gap,
        learningTime: gap * 4, // 4 weeks per level
        resources: [
          {
            type: 'course' as const,
            name: `Master ${skill} - Complete Guide`,
            provider: 'Udemy',
            duration: 40,
            difficulty: currentLevel === 0 ? 'beginner' : currentLevel < 2 ? 'intermediate' : 'advanced',
            link: `https://udemy.com/${skill}`
          },
          {
            type: 'book' as const,
            name: `${skill} Deep Dive`,
            provider: 'O\'Reilly',
            duration: 80,
            difficulty: 'intermediate',
            link: `https://oreilly.com/${skill}`
          }
        ]
      };
    });

    const gapCoveragePercentage = skillGaps.length > 0
      ? Math.round((skillGaps.filter((g: any) => g.gap <= 1).length / skillGaps.length) * 100)
      : 100;

    const overallReadiness = Math.max(0, 100 - (skillGaps.reduce((sum: any, g: any) => sum + g.gap * 15, 0)));

    const analysis = {
      userId,
      targetRole,
      currentSkills: currentSkills.slice(0, 10),
      requiredSkills: Array.from(requiredSkillsMap.entries()).slice(0, 15).map(([skill, data]) => ({
        skill,
        proficiency: data.priority === 'critical' ? 4 : 3,
        priority: data.priority,
        importance: (data.count / targetJobs.length) * 100
      })),
      skillGaps: skillGaps.slice(0, 10),
      gapCoveragePercentage,
      overallReadiness: Math.round(overallReadiness)
    };

    // Save to database
    await SkillGapAnalysis.create(analysis);

    console.log(`Generated skill gap analysis for user ${userId} targeting role ${targetRole}`);

    res.json(analysis);
  } catch (error: any) {
    console.error('Error fetching skill gap analysis:', error);
    res.status(500).json({ error: 'Failed to fetch skill gap analysis', details: error.message });
  }
};

// Get career path planning
export const getCareerPath = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if career path exists
    let careerPath = await CareerPath.findOne({ userId });
    
    if (!careerPath) {
      // Get user data
      const user = await User.findById(userId).select('parsedResumeData expectedSalary');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const yearsOfExp = user.parsedResumeData?.parsedProfile?.yearsOfExperience || 0;
      const currentJobTitle = user.parsedResumeData?.parsedProfile?.jobTitle || 'Professional';

      // Create new career path
      careerPath = new CareerPath({
        userId,
        currentRole: currentJobTitle,
        currentLevel: determineLevel(yearsOfExp),
        currentSalaryRange: { min: 400000, max: 800000 },
        yearsOfExperience: yearsOfExp,
        careerGoal: 'Advance to senior role with leadership opportunities',
        timeline: 'medium-term',
        pathSuggestions: generatePathSuggestions(currentJobTitle),
        developmentRecommendations: generateDevelopmentPlan(),
        marketDemand: {
          currentRole: Math.floor(Math.random() * 5000) + 1000,
          targetRole: Math.floor(Math.random() * 3000) + 500,
          growthTrend: 12,
          salaryTrend: 8
        },
        pathCompletionPercentage: 0
      });

      await careerPath.save();
    }

    console.log(`Retrieved career path for user ${userId}`);

    res.json({
      userId,
      ...careerPath.toObject()
    });
  } catch (error: any) {
    console.error('Error fetching career path:', error);
    res.status(500).json({ error: 'Failed to fetch career path', details: error.message });
  }
};

// Get recommendation insights
export const getRecommendationInsights = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { weeks = 4 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get recommendations from past period
    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - parseInt(weeks as string) * 7);

    const recommendations = await JobRecommendation.find({
      userId,
      recommendedAt: { $gte: weekStartDate }
    });

    if (recommendations.length === 0) {
      return res.json({
        userId,
        message: 'No recommendations in the selected period',
        insights: {}
      });
    }

    // Calculate metrics
    const viewed = recommendations.filter((r: any) => r.clicked).length;
    const applied = recommendations.filter((r: any) => r.applied).length;
    const clickThroughRate = (viewed / recommendations.length) * 100;
    const conversionRate = (applied / recommendations.length) * 100;

    // Calculate engagement
    let userEngagement = 'low';
    if (clickThroughRate > 40) {
      userEngagement = 'high';
    } else if (clickThroughRate > 20) {
      userEngagement = 'medium';
    }

    const insights = {
      userId,
      weekStartDate,
      recommendationsReceived: recommendations.length,
      recommendationsViewed: viewed,
      recommendationsClicked: viewed,
      applicationsFromRecommendations: applied,
      clickThroughRate: Math.round(clickThroughRate),
      conversionRate: Math.round(conversionRate),
      averageMatchScore: Math.round(recommendations.reduce((sum: any, r: any) => sum + r.matchScore, 0) / recommendations.length),
      topMatchedSkills: [],
      topRecommendedIndustries: [],
      userEngagement,
      recommendationQualityFeedback: {
        relevant: recommendations.filter((r: any) => r.feedback === 'relevant').length,
        irrelevant: recommendations.filter((r: any) => r.feedback === 'irrelevant').length,
        neutral: 0
      },
      suggestedActions: generateSuggestedActions(clickThroughRate, conversionRate)
    };

    // Save insights
    await RecommendationInsight.create(insights);

    console.log(`Generated recommendation insights for user ${userId}`);

    res.json(insights);
  } catch (error: any) {
    console.error('Error fetching recommendation insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights', details: error.message });
  }
};

// Update user recommendation preferences
export const updateRecommendationPreferences = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Validate preferences
    if (!preferences.salaryRange || !preferences.salaryRange.min || !preferences.salaryRange.max) {
      return res.status(400).json({ error: 'Valid salary range is required' });
    }

    let userPrefs = await UserRecommendationPreference.findOne({ userId });

    if (!userPrefs) {
      userPrefs = new UserRecommendationPreference({
        userId,
        ...preferences
      });
    } else {
      Object.assign(userPrefs, preferences);
      userPrefs.lastPreferenceUpdate = new Date();
    }

    await userPrefs.save();

    console.log(`Updated recommendation preferences for user ${userId}`);

    res.json({
      message: 'Preferences updated successfully',
      preferences: userPrefs
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences', details: error.message });
  }
};

// Record recommendation feedback (click, apply, etc)
export const recordRecommendationFeedback = async (req: any, res: Response) => {
  try {
    const { userId, recommendationId } = req.params;
    const { action, feedback } = req.body; // action: 'click', 'apply', feedback: 'relevant'

    if (!userId || !recommendationId || !action) {
      return res.status(400).json({ error: 'userId, recommendationId, and action are required' });
    }

    const recommendation = await JobRecommendation.findById(recommendationId);
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    // Update based on action
    if (action === 'click') {
      recommendation.clicked = true;
      recommendation.clickedAt = new Date();
    } else if (action === 'apply') {
      recommendation.applied = true;
      recommendation.appliedAt = new Date();
    }

    if (feedback) {
      recommendation.feedback = feedback;
      recommendation.feedbackAt = new Date();
    }

    await recommendation.save();

    console.log(`Recorded ${action} feedback for recommendation ${recommendationId}`);

    res.json({
      message: 'Feedback recorded successfully',
      recommendation
    });
  } catch (error: any) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ error: 'Failed to record feedback', details: error.message });
  }
};

// Helper functions
function calculateSkillMatch(userSkills: any[], requiredSkills: any[]): number {
  if (requiredSkills.length === 0) return 100;

  const userSkillNames = userSkills.map((s: any) => s.name?.toLowerCase() || s.toLowerCase());
  const matchCount = requiredSkills.filter((req: any) => {
    const reqName = req.name?.toLowerCase() || req.toLowerCase();
    return userSkillNames.includes(reqName);
  }).length;

  return (matchCount / requiredSkills.length) * 100;
}

function calculateExperienceMatch(userExperience: any[], required: number): number {
  const avgYears = userExperience.length > 0
    ? userExperience.reduce((sum: any, exp: any) => sum + (exp.yearsOfExperience || 0), 0) / userExperience.length
    : 0;

  if (avgYears >= required) return 100;
  return (avgYears / Math.max(required, 1)) * 100;
}

function calculateSalaryMatch(salaryRange: any, jobSalary: any): number {
  if (!jobSalary || !jobSalary.min) return 50;
  if (jobSalary.min <= salaryRange.max && jobSalary.min >= salaryRange.min) return 100;
  if (jobSalary.min <= salaryRange.max) return 75;
  return 50;
}

function calculateLocationMatch(preferredLocations: string[], jobLocation: string): number {
  if (preferredLocations.length === 0) return 100;
  return preferredLocations.some(loc => jobLocation?.includes(loc)) ? 100 : 40;
}

function calculateCareerGrowthMatch(growthPotential: number): number {
  return Math.min(100, growthPotential * 100);
}

function determineLevel(yearsOfExperience: number): 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'executive' {
  if (yearsOfExperience < 2) return 'junior';
  if (yearsOfExperience < 5) return 'mid';
  if (yearsOfExperience < 8) return 'senior';
  if (yearsOfExperience < 12) return 'lead';
  if (yearsOfExperience < 15) return 'manager';
  return 'executive';
}

function generatePathSuggestions(currentRole: string): any[] {
  return [
    {
      sequence: 1,
      intermediateRole: 'Senior ' + currentRole,
      level: 'senior',
      estimatedYears: 2,
      skillsDeveloped: ['Leadership', 'Project Management', 'Technical Expertise'],
      salaryGrowth: 25,
      jobOpportunitiesCount: 3500,
      migrationStrategy: 'Develop depth in current specialty'
    },
    {
      sequence: 2,
      intermediateRole: 'Team Lead / Manager',
      level: 'lead',
      estimatedYears: 2,
      skillsDeveloped: ['People Management', 'Strategic Planning', 'Communication'],
      salaryGrowth: 35,
      jobOpportunitiesCount: 2100,
      migrationStrategy: 'Transition to management track'
    },
    {
      sequence: 3,
      intermediateRole: 'Principal / Staff ' + currentRole,
      level: 'manager',
      estimatedYears: 3,
      skillsDeveloped: ['Strategy', 'Architecture', 'Mentoring'],
      salaryGrowth: 45,
      jobOpportunitiesCount: 1200,
      migrationStrategy: 'Become subject matter expert'
    }
  ];
}

function generateDevelopmentPlan(): any[] {
  return [
    {
      category: 'technical' as const,
      focus: 'Advanced Technical Skills',
      importance: 'high',
      action: 'Complete certifications and advanced courses',
      timeline: 6
    },
    {
      category: 'soft-skills' as const,
      focus: 'Leadership & Communication',
      importance: 'high',
      action: 'Join speaking/leadership programs',
      timeline: 6
    },
    {
      category: 'management' as const,
      focus: 'People Management',
      importance: 'medium',
      action: 'Take management courses',
      timeline: 9
    },
    {
      category: 'domain' as const,
      focus: 'Industry Knowledge',
      importance: 'medium',
      action: 'Attend industry conferences',
      timeline: 12
    }
  ];
}

function generateSuggestedActions(ctr: number, conversionRate: number): string[] {
  const actions: string[] = [];

  if (ctr < 20) actions.push('Improve recommendation targeting - consider updating preferences');
  if (conversionRate < 5) actions.push('Recommendations not converting - adjust job criteria');
  if (ctr > 50) actions.push('High engagement! Consider more frequent recommendations');
  if (conversionRate > 15) actions.push('Excellent conversion rate - continue current preferences');

  return actions.length > 0 ? actions : ['Continue monitoring recommendation patterns'];
}

export default {
  getJobRecommendations,
  getSkillGapAnalysis,
  getCareerPath,
  getRecommendationInsights,
  updateRecommendationPreferences,
  recordRecommendationFeedback
};

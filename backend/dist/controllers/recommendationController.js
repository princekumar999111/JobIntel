"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordRecommendationFeedback = exports.updateRecommendationPreferences = exports.getRecommendationInsights = exports.getCareerPath = exports.getSkillGapAnalysis = exports.getJobRecommendations = void 0;
const Recommendation_1 = require("../models/Recommendation");
const Job_1 = require("../models/Job");
const User_1 = require("../models/User");
// Get personalized job recommendations for user
const getJobRecommendations = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10, algorithm = 'hybrid' } = req.query;
        // Validate input
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        // Get user data
        const user = await User_1.User.findById(userId).select('skills parsedResumeData expectedSalary location');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Get user preferences
        const preferences = await Recommendation_1.UserRecommendationPreference.findOne({ userId });
        // Calculate match scores using different algorithms
        const allJobs = await Job_1.Job.find({ status: 'active' }).populate('companyId').limit(500);
        const recommendations = allJobs.map((job) => {
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
            }
            else if (algorithm === 'collaborative') {
                matchScore = (skillMatch * 0.3 + experienceMatch * 0.3 + salaryMatch * 0.2 + locationMatch * 0.1 + careerGrowth * 0.1);
            }
            else {
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
        }).filter((rec) => rec.matchScore >= 40).sort((a, b) => b.matchScore - a.matchScore).slice(0, parseInt(limit));
        // Save recommendations to database
        for (const rec of recommendations) {
            await Recommendation_1.JobRecommendation.create({
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
    }
    catch (error) {
        console.error('Error fetching job recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations', details: error.message });
    }
};
exports.getJobRecommendations = getJobRecommendations;
// Get skill gap analysis for user targeting a role
const getSkillGapAnalysis = async (req, res) => {
    try {
        const { userId, targetRole } = req.params;
        if (!userId || !targetRole) {
            return res.status(400).json({ error: 'userId and targetRole are required' });
        }
        // Get user current skills
        const user = await User_1.User.findById(userId).select('skills parsedResumeData');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const currentSkills = user.skills || [];
        // Get target role requirements from job market data
        const targetJobs = await Job_1.Job.find({ title: new RegExp(targetRole, 'i') }).select('requiredSkills').limit(50);
        // Aggregate required skills
        const requiredSkillsMap = new Map();
        targetJobs.forEach((job) => {
            (job.requiredSkills || []).forEach((skill) => {
                const key = typeof skill === 'string' ? skill.toLowerCase() : (skill.name?.toLowerCase() || '');
                if (key) {
                    const existing = requiredSkillsMap.get(key) || { count: 0, priority: 'medium' };
                    requiredSkillsMap.set(key, { count: existing.count + 1, priority: existing.count > 25 ? 'critical' : 'high' });
                }
            });
        });
        // Calculate skill gaps
        const skillGaps = Array.from(requiredSkillsMap.entries()).map(([skill, data]) => {
            const hasSkill = currentSkills.some((s) => s.toLowerCase() === skill);
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
                        type: 'course',
                        name: `Master ${skill} - Complete Guide`,
                        provider: 'Udemy',
                        duration: 40,
                        difficulty: currentLevel === 0 ? 'beginner' : currentLevel < 2 ? 'intermediate' : 'advanced',
                        link: `https://udemy.com/${skill}`
                    },
                    {
                        type: 'book',
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
            ? Math.round((skillGaps.filter((g) => g.gap <= 1).length / skillGaps.length) * 100)
            : 100;
        const overallReadiness = Math.max(0, 100 - (skillGaps.reduce((sum, g) => sum + g.gap * 15, 0)));
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
        await Recommendation_1.SkillGapAnalysis.create(analysis);
        console.log(`Generated skill gap analysis for user ${userId} targeting role ${targetRole}`);
        res.json(analysis);
    }
    catch (error) {
        console.error('Error fetching skill gap analysis:', error);
        res.status(500).json({ error: 'Failed to fetch skill gap analysis', details: error.message });
    }
};
exports.getSkillGapAnalysis = getSkillGapAnalysis;
// Get career path planning
const getCareerPath = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        // Check if career path exists
        let careerPath = await Recommendation_1.CareerPath.findOne({ userId });
        if (!careerPath) {
            // Get user data
            const user = await User_1.User.findById(userId).select('parsedResumeData expectedSalary');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const yearsOfExp = user.parsedResumeData?.parsedProfile?.yearsOfExperience || 0;
            const currentJobTitle = user.parsedResumeData?.parsedProfile?.jobTitle || 'Professional';
            // Create new career path
            careerPath = new Recommendation_1.CareerPath({
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
    }
    catch (error) {
        console.error('Error fetching career path:', error);
        res.status(500).json({ error: 'Failed to fetch career path', details: error.message });
    }
};
exports.getCareerPath = getCareerPath;
// Get recommendation insights
const getRecommendationInsights = async (req, res) => {
    try {
        const { userId } = req.params;
        const { weeks = 4 } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        // Get recommendations from past period
        const weekStartDate = new Date();
        weekStartDate.setDate(weekStartDate.getDate() - parseInt(weeks) * 7);
        const recommendations = await Recommendation_1.JobRecommendation.find({
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
        const viewed = recommendations.filter((r) => r.clicked).length;
        const applied = recommendations.filter((r) => r.applied).length;
        const clickThroughRate = (viewed / recommendations.length) * 100;
        const conversionRate = (applied / recommendations.length) * 100;
        // Calculate engagement
        let userEngagement = 'low';
        if (clickThroughRate > 40) {
            userEngagement = 'high';
        }
        else if (clickThroughRate > 20) {
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
            averageMatchScore: Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length),
            topMatchedSkills: [],
            topRecommendedIndustries: [],
            userEngagement,
            recommendationQualityFeedback: {
                relevant: recommendations.filter((r) => r.feedback === 'relevant').length,
                irrelevant: recommendations.filter((r) => r.feedback === 'irrelevant').length,
                neutral: 0
            },
            suggestedActions: generateSuggestedActions(clickThroughRate, conversionRate)
        };
        // Save insights
        await Recommendation_1.RecommendationInsight.create(insights);
        console.log(`Generated recommendation insights for user ${userId}`);
        res.json(insights);
    }
    catch (error) {
        console.error('Error fetching recommendation insights:', error);
        res.status(500).json({ error: 'Failed to fetch insights', details: error.message });
    }
};
exports.getRecommendationInsights = getRecommendationInsights;
// Update user recommendation preferences
const updateRecommendationPreferences = async (req, res) => {
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
        let userPrefs = await Recommendation_1.UserRecommendationPreference.findOne({ userId });
        if (!userPrefs) {
            userPrefs = new Recommendation_1.UserRecommendationPreference({
                userId,
                ...preferences
            });
        }
        else {
            Object.assign(userPrefs, preferences);
            userPrefs.lastPreferenceUpdate = new Date();
        }
        await userPrefs.save();
        console.log(`Updated recommendation preferences for user ${userId}`);
        res.json({
            message: 'Preferences updated successfully',
            preferences: userPrefs
        });
    }
    catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences', details: error.message });
    }
};
exports.updateRecommendationPreferences = updateRecommendationPreferences;
// Record recommendation feedback (click, apply, etc)
const recordRecommendationFeedback = async (req, res) => {
    try {
        const { userId, recommendationId } = req.params;
        const { action, feedback } = req.body; // action: 'click', 'apply', feedback: 'relevant'
        if (!userId || !recommendationId || !action) {
            return res.status(400).json({ error: 'userId, recommendationId, and action are required' });
        }
        const recommendation = await Recommendation_1.JobRecommendation.findById(recommendationId);
        if (!recommendation) {
            return res.status(404).json({ error: 'Recommendation not found' });
        }
        // Update based on action
        if (action === 'click') {
            recommendation.clicked = true;
            recommendation.clickedAt = new Date();
        }
        else if (action === 'apply') {
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
    }
    catch (error) {
        console.error('Error recording feedback:', error);
        res.status(500).json({ error: 'Failed to record feedback', details: error.message });
    }
};
exports.recordRecommendationFeedback = recordRecommendationFeedback;
// Helper functions
function calculateSkillMatch(userSkills, requiredSkills) {
    if (requiredSkills.length === 0)
        return 100;
    const userSkillNames = userSkills.map((s) => s.name?.toLowerCase() || s.toLowerCase());
    const matchCount = requiredSkills.filter((req) => {
        const reqName = req.name?.toLowerCase() || req.toLowerCase();
        return userSkillNames.includes(reqName);
    }).length;
    return (matchCount / requiredSkills.length) * 100;
}
function calculateExperienceMatch(userExperience, required) {
    const avgYears = userExperience.length > 0
        ? userExperience.reduce((sum, exp) => sum + (exp.yearsOfExperience || 0), 0) / userExperience.length
        : 0;
    if (avgYears >= required)
        return 100;
    return (avgYears / Math.max(required, 1)) * 100;
}
function calculateSalaryMatch(salaryRange, jobSalary) {
    if (!jobSalary || !jobSalary.min)
        return 50;
    if (jobSalary.min <= salaryRange.max && jobSalary.min >= salaryRange.min)
        return 100;
    if (jobSalary.min <= salaryRange.max)
        return 75;
    return 50;
}
function calculateLocationMatch(preferredLocations, jobLocation) {
    if (preferredLocations.length === 0)
        return 100;
    return preferredLocations.some(loc => jobLocation?.includes(loc)) ? 100 : 40;
}
function calculateCareerGrowthMatch(growthPotential) {
    return Math.min(100, growthPotential * 100);
}
function determineLevel(yearsOfExperience) {
    if (yearsOfExperience < 2)
        return 'junior';
    if (yearsOfExperience < 5)
        return 'mid';
    if (yearsOfExperience < 8)
        return 'senior';
    if (yearsOfExperience < 12)
        return 'lead';
    if (yearsOfExperience < 15)
        return 'manager';
    return 'executive';
}
function generatePathSuggestions(currentRole) {
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
function generateDevelopmentPlan() {
    return [
        {
            category: 'technical',
            focus: 'Advanced Technical Skills',
            importance: 'high',
            action: 'Complete certifications and advanced courses',
            timeline: 6
        },
        {
            category: 'soft-skills',
            focus: 'Leadership & Communication',
            importance: 'high',
            action: 'Join speaking/leadership programs',
            timeline: 6
        },
        {
            category: 'management',
            focus: 'People Management',
            importance: 'medium',
            action: 'Take management courses',
            timeline: 9
        },
        {
            category: 'domain',
            focus: 'Industry Knowledge',
            importance: 'medium',
            action: 'Attend industry conferences',
            timeline: 12
        }
    ];
}
function generateSuggestedActions(ctr, conversionRate) {
    const actions = [];
    if (ctr < 20)
        actions.push('Improve recommendation targeting - consider updating preferences');
    if (conversionRate < 5)
        actions.push('Recommendations not converting - adjust job criteria');
    if (ctr > 50)
        actions.push('High engagement! Consider more frequent recommendations');
    if (conversionRate > 15)
        actions.push('Excellent conversion rate - continue current preferences');
    return actions.length > 0 ? actions : ['Continue monitoring recommendation patterns'];
}
exports.default = {
    getJobRecommendations: exports.getJobRecommendations,
    getSkillGapAnalysis: exports.getSkillGapAnalysis,
    getCareerPath: exports.getCareerPath,
    getRecommendationInsights: exports.getRecommendationInsights,
    updateRecommendationPreferences: exports.updateRecommendationPreferences,
    recordRecommendationFeedback: exports.recordRecommendationFeedback
};

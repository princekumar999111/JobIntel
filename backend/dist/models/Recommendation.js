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
exports.RecommendationInsight = exports.UserRecommendationPreference = exports.CareerPath = exports.SkillGapAnalysis = exports.JobRecommendation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Job Recommendation Schema
const jobRecommendationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchReasoning: {
        skillMatch: { type: Number, required: true },
        experienceMatch: { type: Number, required: true },
        salaryMatch: { type: Number, required: true },
        locationMatch: { type: Number, required: true },
        careerGrowth: { type: Number, required: true }
    },
    algorithmType: { type: String, enum: ['content-based', 'collaborative', 'hybrid', 'ml-based'], required: true },
    confidenceLevel: { type: Number, required: true, min: 0, max: 1 },
    recommendedAt: { type: Date, default: Date.now, index: true },
    expireAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days
    clicked: { type: Boolean, default: false },
    clickedAt: Date,
    applied: { type: Boolean, default: false },
    appliedAt: Date,
    feedback: { type: String, enum: ['relevant', 'irrelevant', 'already-applied'] },
    feedbackAt: Date
}, { timestamps: true });
// TTL index for auto-cleanup of old recommendations
jobRecommendationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
jobRecommendationSchema.index({ userId: 1, recommendedAt: -1 });
jobRecommendationSchema.index({ userId: 1, jobId: 1 });
// Skill Gap Analysis Schema
const skillGapAnalysisSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetJobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job' },
    targetRole: String,
    currentSkills: [
        {
            skill: { type: String, required: true },
            proficiency: { type: Number, required: true, min: 1, max: 5 },
            experience: { type: Number, required: true },
            lastUsed: { type: Date, default: Date.now }
        }
    ],
    requiredSkills: [
        {
            skill: { type: String, required: true },
            proficiency: { type: Number, required: true, min: 1, max: 5 },
            priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
            importance: { type: Number, required: true, min: 0, max: 100 }
        }
    ],
    skillGaps: [
        {
            skill: { type: String, required: true },
            currentLevel: { type: Number, required: true },
            requiredLevel: { type: Number, required: true },
            gap: { type: Number, required: true },
            learningTime: { type: Number, required: true },
            resources: [
                {
                    type: { type: String, enum: ['course', 'book', 'project', 'certification'], required: true },
                    name: { type: String, required: true },
                    provider: { type: String, required: true },
                    duration: { type: Number, required: true },
                    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
                    link: String
                }
            ]
        }
    ],
    gapCoveragePercentage: { type: Number, required: true, min: 0, max: 100 },
    overallReadiness: { type: Number, required: true, min: 0, max: 100 },
    roadmapGenerated: { type: Boolean, default: false },
    roadmapGeneratedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
skillGapAnalysisSchema.index({ userId: 1, updatedAt: -1 });
skillGapAnalysisSchema.index({ userId: 1, targetRole: 1 });
// Career Path Schema
const careerPathSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    currentRole: { type: String, required: true },
    currentLevel: { type: String, enum: ['junior', 'mid', 'senior', 'lead', 'manager', 'executive'], required: true },
    currentSalaryRange: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    yearsOfExperience: { type: Number, required: true },
    careerGoal: { type: String, required: true },
    targetRole: String,
    targetLevel: { type: String, enum: ['junior', 'mid', 'senior', 'lead', 'manager', 'executive'] },
    targetSalaryRange: {
        min: Number,
        max: Number
    },
    timeline: { type: String, enum: ['short-term', 'medium-term', 'long-term'], required: true },
    pathSuggestions: [
        {
            sequence: { type: Number, required: true },
            intermediateRole: { type: String, required: true },
            level: String,
            estimatedYears: { type: Number, required: true },
            skillsDeveloped: [String],
            salaryGrowth: { type: Number, required: true },
            jobOpportunitiesCount: { type: Number, required: true },
            migrationStrategy: String
        }
    ],
    developmentRecommendations: [
        {
            category: { type: String, enum: ['technical', 'soft-skills', 'management', 'domain'], required: true },
            focus: { type: String, required: true },
            importance: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
            action: { type: String, required: true },
            timeline: { type: Number, required: true }
        }
    ],
    marketDemand: {
        currentRole: { type: Number, required: true },
        targetRole: { type: Number, required: true },
        growthTrend: { type: Number, required: true },
        salaryTrend: { type: Number, required: true }
    },
    pathStartedAt: { type: Date, default: Date.now },
    pathUpdatedAt: { type: Date, default: Date.now },
    pathCompletionPercentage: { type: Number, required: true, min: 0, max: 100 }
}, { timestamps: true });
// User Recommendation Preference Schema
const userRecommendationPreferenceSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    preferredIndustries: [String],
    preferredRoles: [String],
    preferredCompanySize: { type: String, enum: ['startup', 'scale-up', 'mid-size', 'enterprise', 'any'], default: 'any' },
    preferredLocations: [String],
    remotePreference: { type: String, enum: ['fully-remote', 'hybrid', 'on-site', 'any'], default: 'any' },
    salaryRange: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    experienceLevelPreference: [String],
    careerGrowthPriority: { type: Number, required: true, min: 0, max: 100 },
    workLifeBalancePriority: { type: Number, required: true, min: 0, max: 100 },
    learningOpportunitiesPriority: { type: Number, required: true, min: 0, max: 100 },
    compensationPriority: { type: Number, required: true, min: 0, max: 100 },
    jobSecurityPriority: { type: Number, required: true, min: 0, max: 100 },
    excludedCompanies: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Company' }],
    excludedRoles: [String],
    recommendationFrequency: { type: String, enum: ['daily', 'weekly', 'bi-weekly', 'monthly'], default: 'weekly' },
    notificationsEnabled: { type: Boolean, default: true },
    lastPreferenceUpdate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
// Recommendation Insight Schema
const recommendationInsightSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStartDate: { type: Date, required: true, index: true },
    recommendationsReceived: { type: Number, required: true },
    recommendationsViewed: { type: Number, required: true },
    recommendationsClicked: { type: Number, required: true },
    applicationsFromRecommendations: { type: Number, required: true },
    clickThroughRate: { type: Number, required: true },
    conversionRate: { type: Number, required: true },
    averageMatchScore: { type: Number, required: true },
    topMatchedSkills: [
        {
            skill: { type: String, required: true },
            count: { type: Number, required: true }
        }
    ],
    topRecommendedIndustries: [
        {
            industry: { type: String, required: true },
            count: { type: Number, required: true }
        }
    ],
    userEngagement: { type: String, enum: ['high', 'medium', 'low'], required: true },
    recommendationQualityFeedback: {
        relevant: { type: Number, default: 0 },
        irrelevant: { type: Number, default: 0 },
        neutral: { type: Number, default: 0 }
    },
    suggestedActions: [String],
    insightGeneratedAt: { type: Date, default: Date.now }
}, { timestamps: true });
// Models
exports.JobRecommendation = mongoose_1.default.model('JobRecommendation', jobRecommendationSchema);
exports.SkillGapAnalysis = mongoose_1.default.model('SkillGapAnalysis', skillGapAnalysisSchema);
exports.CareerPath = mongoose_1.default.model('CareerPath', careerPathSchema);
exports.UserRecommendationPreference = mongoose_1.default.model('UserRecommendationPreference', userRecommendationPreferenceSchema);
exports.RecommendationInsight = mongoose_1.default.model('RecommendationInsight', recommendationInsightSchema);
exports.default = {
    JobRecommendation: exports.JobRecommendation,
    SkillGapAnalysis: exports.SkillGapAnalysis,
    CareerPath: exports.CareerPath,
    UserRecommendationPreference: exports.UserRecommendationPreference,
    RecommendationInsight: exports.RecommendationInsight
};

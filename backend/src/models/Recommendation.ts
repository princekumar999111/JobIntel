import mongoose, { Schema, Document } from 'mongoose';

// Job Recommendation Document Type
export interface IJobRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  matchScore: number; // 0-100 percentage
  matchReasoning: {
    skillMatch: number;
    experienceMatch: number;
    salaryMatch: number;
    locationMatch: number;
    careerGrowth: number;
  };
  algorithmType: 'content-based' | 'collaborative' | 'hybrid' | 'ml-based';
  confidenceLevel: number; // 0-1
  recommendedAt: Date;
  expireAt: Date;
  clicked: boolean;
  clickedAt?: Date;
  applied: boolean;
  appliedAt?: Date;
  feedback?: 'relevant' | 'irrelevant' | 'already-applied';
  feedbackAt?: Date;
}

// User Skill Gap Analysis
export interface ISkillGapAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  targetJobId?: mongoose.Types.ObjectId;
  targetRole?: string;
  currentSkills: Array<{
    skill: string;
    proficiency: number; // 1-5
    experience: number; // years
    lastUsed: Date;
  }>;
  requiredSkills: Array<{
    skill: string;
    proficiency: number; // required level 1-5
    priority: 'critical' | 'high' | 'medium' | 'low';
    importance: number; // 0-100
  }>;
  skillGaps: Array<{
    skill: string;
    currentLevel: number;
    requiredLevel: number;
    gap: number; // difference
    learningTime: number; // estimated weeks
    resources: Array<{
      type: 'course' | 'book' | 'project' | 'certification';
      name: string;
      provider: string;
      duration: number; // hours
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      link?: string;
    }>;
  }>;
  gapCoveragePercentage: number; // 0-100
  overallReadiness: number; // 0-100
  roadmapGenerated: boolean;
  roadmapGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Career Path & Progression
export interface ICareerPath extends Document {
  userId: mongoose.Types.ObjectId;
  currentRole: string;
  currentLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'executive';
  currentSalaryRange: { min: number; max: number };
  yearsOfExperience: number;
  careerGoal: string;
  targetRole?: string;
  targetLevel?: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'executive';
  targetSalaryRange?: { min: number; max: number };
  timeline: 'short-term' | 'medium-term' | 'long-term'; // 6mo, 1-2yr, 2+ yr
  pathSuggestions: Array<{
    sequence: number;
    intermediateRole: string;
    level: string;
    estimatedYears: number;
    skillsDeveloped: string[];
    salaryGrowth: number; // percentage increase
    jobOpportunitiesCount: number;
    migrationStrategy: string;
  }>;
  developmentRecommendations: Array<{
    category: 'technical' | 'soft-skills' | 'management' | 'domain';
    focus: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    timeline: number; // months
  }>;
  marketDemand: {
    currentRole: number; // number of jobs
    targetRole: number;
    growthTrend: number; // percentage
    salaryTrend: number; // percentage
  };
  pathStartedAt: Date;
  pathUpdatedAt: Date;
  pathCompletionPercentage: number; // 0-100
}

// User Recommendation Preferences
export interface IUserRecommendationPreference extends Document {
  userId: mongoose.Types.ObjectId;
  preferredIndustries: string[];
  preferredRoles: string[];
  preferredCompanySize: 'startup' | 'scale-up' | 'mid-size' | 'enterprise' | 'any';
  preferredLocations: string[];
  remotePreference: 'fully-remote' | 'hybrid' | 'on-site' | 'any';
  salaryRange: { min: number; max: number };
  experienceLevelPreference: string[];
  careerGrowthPriority: number; // 0-100
  workLifeBalancePriority: number; // 0-100
  learningOpportunitiesPriority: number; // 0-100
  compensationPriority: number; // 0-100
  jobSecurityPriority: number; // 0-100
  excludedCompanies: mongoose.Types.ObjectId[];
  excludedRoles: string[];
  recommendationFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  notificationsEnabled: boolean;
  lastPreferenceUpdate: Date;
  createdAt: Date;
}

// Recommendation Insights & Engagement
export interface IRecommendationInsight extends Document {
  userId: mongoose.Types.ObjectId;
  weekStartDate: Date;
  recommendationsReceived: number;
  recommendationsViewed: number;
  recommendationsClicked: number;
  applicationsFromRecommendations: number;
  clickThroughRate: number; // percentage
  conversionRate: number; // percentage
  averageMatchScore: number;
  topMatchedSkills: Array<{ skill: string; count: number }>;
  topRecommendedIndustries: Array<{ industry: string; count: number }>;
  userEngagement: 'high' | 'medium' | 'low';
  recommendationQualityFeedback: {
    relevant: number;
    irrelevant: number;
    neutral: number;
  };
  suggestedActions: string[];
  insightGeneratedAt: Date;
}

// Job Recommendation Schema
const jobRecommendationSchema = new Schema<IJobRecommendation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
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
  },
  { timestamps: true }
);

// TTL index for auto-cleanup of old recommendations
jobRecommendationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
jobRecommendationSchema.index({ userId: 1, recommendedAt: -1 });
jobRecommendationSchema.index({ userId: 1, jobId: 1 });

// Skill Gap Analysis Schema
const skillGapAnalysisSchema = new Schema<ISkillGapAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetJobId: { type: Schema.Types.ObjectId, ref: 'Job' },
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
  },
  { timestamps: true }
);

skillGapAnalysisSchema.index({ userId: 1, updatedAt: -1 });
skillGapAnalysisSchema.index({ userId: 1, targetRole: 1 });

// Career Path Schema
const careerPathSchema = new Schema<ICareerPath>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
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
  },
  { timestamps: true }
);

// User Recommendation Preference Schema
const userRecommendationPreferenceSchema = new Schema<IUserRecommendationPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
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
    excludedCompanies: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
    excludedRoles: [String],
    recommendationFrequency: { type: String, enum: ['daily', 'weekly', 'bi-weekly', 'monthly'], default: 'weekly' },
    notificationsEnabled: { type: Boolean, default: true },
    lastPreferenceUpdate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Recommendation Insight Schema
const recommendationInsightSchema = new Schema<IRecommendationInsight>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
  },
  { timestamps: true }
);

// Models
export const JobRecommendation = mongoose.model<IJobRecommendation>('JobRecommendation', jobRecommendationSchema);
export const SkillGapAnalysis = mongoose.model<ISkillGapAnalysis>('SkillGapAnalysis', skillGapAnalysisSchema);
export const CareerPath = mongoose.model<ICareerPath>('CareerPath', careerPathSchema);
export const UserRecommendationPreference = mongoose.model<IUserRecommendationPreference>('UserRecommendationPreference', userRecommendationPreferenceSchema);
export const RecommendationInsight = mongoose.model<IRecommendationInsight>('RecommendationInsight', recommendationInsightSchema);

export default {
  JobRecommendation,
  SkillGapAnalysis,
  CareerPath,
  UserRecommendationPreference,
  RecommendationInsight
};

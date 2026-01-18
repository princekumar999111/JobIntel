"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAnalytics = exports.CompanyAnalytics = exports.UserAnalytics = exports.JobAnalytics = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
// Schemas
const JobAnalyticsSchema = new Schema({
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    date: { type: Date, default: Date.now, index: true },
    totalViews: { type: Number, default: 0, min: 0 },
    uniqueViews: { type: Number, default: 0, min: 0 },
    viewTrend: { type: Number, default: 0 },
    totalApplications: { type: Number, default: 0, min: 0 },
    applicationRate: { type: Number, default: 0, min: 0, max: 100 },
    applicationTrend: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0, min: 0 },
    bookmarkCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },
    completenessScore: { type: Number, default: 0, min: 0, max: 100 },
    viewsByCountry: { type: Schema.Types.Mixed, default: {} },
    applicationsByCountry: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
const UserAnalyticsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    loginCount: { type: Number, default: 0, min: 0 },
    jobsViewed: { type: Number, default: 0, min: 0 },
    jobsApplied: { type: Number, default: 0, min: 0 },
    profileViews: { type: Number, default: 0, min: 0 },
    profileUpdates: { type: Number, default: 0, min: 0 },
    engagementScore: { type: Number, default: 0, min: 0, max: 100 },
    activityLevel: { type: String, enum: ["high", "medium", "low", "inactive"], default: "low" },
    topSkillsSearched: { type: [String], default: [] },
    topLocationsSearched: { type: [String], default: [] },
    topCompaniesSearched: { type: [String], default: [] },
    activeApplications: { type: Number, default: 0, min: 0 },
    successfulApplications: { type: Number, default: 0, min: 0 },
    rejectedApplications: { type: Number, default: 0, min: 0 },
    applicationSuccessRate: { type: Number, default: 0, min: 0, max: 100 },
    totalSessionDuration: { type: Number, default: 0, min: 0 },
    averageSessionDuration: { type: Number, default: 0, min: 0 },
    sessionCount: { type: Number, default: 0, min: 0 },
    deviceTypes: {
        type: {
            web: { type: Number, default: 0 },
            mobile: { type: Number, default: 0 },
            tablet: { type: Number, default: 0 },
        },
        default: { web: 0, mobile: 0, tablet: 0 },
    },
    lastDeviceUsed: String,
    isSubscribed: { type: Boolean, default: false },
    subscriptionType: String,
}, { timestamps: true });
const CompanyAnalyticsSchema = new Schema({
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    profileViews: { type: Number, default: 0, min: 0 },
    profileViewTrend: { type: Number, default: 0 },
    activeJobs: { type: Number, default: 0, min: 0 },
    totalJobsPosted: { type: Number, default: 0, min: 0 },
    totalApplicationsReceived: { type: Number, default: 0, min: 0 },
    averageApplicationsPerJob: { type: Number, default: 0, min: 0 },
    positionsFilledThisMonth: { type: Number, default: 0, min: 0 },
    averageTimeToFill: { type: Number, default: 0, min: 0 },
    conversionRate: { type: Number, default: 0, min: 0, max: 100 },
    companyRating: { type: Number, default: 0, min: 0, max: 5 },
    employeeRatings: { type: Number, default: 0, min: 0 },
    jobQualityScore: { type: Number, default: 0, min: 0, max: 100 },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
    jobPostingFrequency: { type: Number, default: 0, min: 0 },
    responseRate: { type: Number, default: 0, min: 0, max: 100 },
    averageResponseTime: { type: Number, default: 0, min: 0 },
    topLocations: { type: [{ location: String, count: Number }], default: [] },
    topSkillsDemanded: { type: [{ skill: String, count: Number }], default: [] },
    viewsThisMonth: { type: Number, default: 0, min: 0 },
    applicationsThisMonth: { type: Number, default: 0, min: 0 },
    jobsPostedThisMonth: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
const PlatformAnalyticsSchema = new Schema({
    date: { type: Date, default: Date.now, index: true },
    totalUsers: { type: Number, default: 0, min: 0 },
    activeUsers: { type: Number, default: 0, min: 0 },
    newUsersToday: { type: Number, default: 0, min: 0 },
    userGrowthRate: { type: Number, default: 0 },
    totalJobsListed: { type: Number, default: 0, min: 0 },
    activeJobs: { type: Number, default: 0, min: 0 },
    jobsPostedToday: { type: Number, default: 0, min: 0 },
    jobGrowthRate: { type: Number, default: 0 },
    totalCompanies: { type: Number, default: 0, min: 0 },
    activeCompanies: { type: Number, default: 0, min: 0 },
    newCompaniesThisMonth: { type: Number, default: 0, min: 0 },
    totalApplications: { type: Number, default: 0, min: 0 },
    applicationsToday: { type: Number, default: 0, min: 0 },
    applicationTrend: { type: Number, default: 0 },
    averageApplicationsPerJob: { type: Number, default: 0, min: 0 },
    dailyActiveUsers: { type: Number, default: 0, min: 0 },
    monthlyActiveUsers: { type: Number, default: 0, min: 0 },
    weeklyActiveUsers: { type: Number, default: 0, min: 0 },
    avgSessionDuration: { type: Number, default: 0, min: 0 },
    bounceRate: { type: Number, default: 0, min: 0, max: 100 },
    topSearchQueries: { type: [{ query: String, count: Number }], default: [] },
    topLocations: { type: [{ location: String, count: Number }], default: [] },
    topSkills: { type: [{ skill: String, count: Number }], default: [] },
    signupConversion: { type: Number, default: 0, min: 0, max: 100 },
    jobApplicationConversion: { type: Number, default: 0, min: 0, max: 100 },
    subscriptionConversion: { type: Number, default: 0, min: 0, max: 100 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    newSubscriptions: { type: Number, default: 0, min: 0 },
    canceledSubscriptions: { type: Number, default: 0, min: 0 },
    monthlyRecurringRevenue: { type: Number, default: 0, min: 0 },
    churnRate: { type: Number, default: 0, min: 0, max: 100 },
    pageLoadTime: { type: Number, default: 0, min: 0 },
    apiResponseTime: { type: Number, default: 0, min: 0 },
    errorRate: { type: Number, default: 0, min: 0, max: 100 },
    uptime: { type: Number, default: 100, min: 0, max: 100 },
}, { timestamps: true });
// Indexes for performance
JobAnalyticsSchema.index({ jobId: 1, date: -1 });
JobAnalyticsSchema.index({ companyId: 1, date: -1 });
JobAnalyticsSchema.index({ date: -1 });
UserAnalyticsSchema.index({ userId: 1, date: -1 });
UserAnalyticsSchema.index({ date: -1 });
UserAnalyticsSchema.index({ activityLevel: 1 });
CompanyAnalyticsSchema.index({ companyId: 1, date: -1 });
CompanyAnalyticsSchema.index({ date: -1 });
PlatformAnalyticsSchema.index({ date: -1 });
// TTL index for automatic cleanup (keep 1 year of data)
JobAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
UserAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
CompanyAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
exports.JobAnalytics = mongoose_1.default.model("JobAnalytics", JobAnalyticsSchema);
exports.UserAnalytics = mongoose_1.default.model("UserAnalytics", UserAnalyticsSchema);
exports.CompanyAnalytics = mongoose_1.default.model("CompanyAnalytics", CompanyAnalyticsSchema);
exports.PlatformAnalytics = mongoose_1.default.model("PlatformAnalytics", PlatformAnalyticsSchema);

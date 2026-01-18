"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobMatchingConfig = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const JobMatchingRuleSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    ruleType: {
        type: String,
        enum: ["skill", "location", "salary", "experience", "qualification", "industry", "custom"],
        required: true,
    },
    operator: {
        type: String,
        enum: ["equals", "contains", "range", "in", "regex"],
        required: true,
    },
    value: Schema.Types.Mixed,
    weight: { type: Number, min: 0, max: 100, default: 50 },
    priority: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
});
const JobMatchingProfileSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    profileName: { type: String, required: true },
    description: String,
    matchingAlgorithm: {
        type: String,
        enum: ["weighted", "ml", "hybrid"],
        default: "weighted",
    },
    rules: [JobMatchingRuleSchema],
    minimumMatchScore: { type: Number, min: 0, max: 100, default: 70 },
    maxResultsPerQuery: { type: Number, default: 50, min: 1, max: 1000 },
    includePartialMatches: { type: Boolean, default: true },
    boostRecentJobs: { type: Boolean, default: true },
    recentJobDaysThreshold: { type: Number, default: 7 },
    enabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const JobMatchingConfigSchema = new Schema({
    matchingEnabled: { type: Boolean, default: true },
    defaultAlgorithm: { type: String, enum: ["weighted", "ml", "hybrid"], default: "weighted" },
    // Algorithm tuning (0-1 scale)
    skillWeightFactor: { type: Number, min: 0, max: 1, default: 0.3 },
    locationWeightFactor: { type: Number, min: 0, max: 1, default: 0.2 },
    salaryWeightFactor: { type: Number, min: 0, max: 1, default: 0.2 },
    experienceWeightFactor: { type: Number, min: 0, max: 1, default: 0.15 },
    qualificationWeightFactor: { type: Number, min: 0, max: 1, default: 0.15 },
    // Performance
    maxConcurrentMatches: { type: Number, default: 100, min: 1 },
    cacheMatchResults: { type: Boolean, default: true },
    cacheTTL: { type: Number, default: 3600 }, // 1 hour
    batchProcessingEnabled: { type: Boolean, default: true },
    batchSize: { type: Number, default: 500, min: 10, max: 5000 },
    // Profiles
    matchingProfiles: [JobMatchingProfileSchema],
    defaultProfileId: { type: Schema.Types.ObjectId },
    // Quality
    minJobQualityScore: { type: Number, min: 0, max: 100, default: 50 },
    filterOutExpiredJobs: { type: Boolean, default: true },
    filterOutDuplicateJobs: { type: Boolean, default: true },
    // History
    trackMatchingHistory: { type: Boolean, default: true },
    retentionDays: { type: Number, default: 90, min: 7, max: 365 },
    // Notifications
    notifyUsersOnNewMatches: { type: Boolean, default: true },
    notificationFrequency: {
        type: String,
        enum: ["instant", "hourly", "daily", "weekly"],
        default: "daily",
    },
    // Analytics
    lastRunAt: Date,
    totalJobsMatched: { type: Number, default: 0 },
    totalMatchesGenerated: { type: Number, default: 0 },
    averageMatchScore: { type: Number, min: 0, max: 100, default: 0 },
    // Activity
    activityLogs: [
        {
            action: String,
            timestamp: { type: Date, default: Date.now },
            userId: { type: Schema.Types.ObjectId, ref: "User" },
            details: Schema.Types.Mixed,
        },
    ],
}, { timestamps: true });
// Indexes for performance
JobMatchingConfigSchema.index({ enabled: 1, defaultAlgorithm: 1 });
JobMatchingConfigSchema.index({ "matchingProfiles.enabled": 1 });
JobMatchingConfigSchema.index({ lastRunAt: -1 });
JobMatchingConfigSchema.index({ "activityLogs.timestamp": -1 });
// TTL index for automatic activity log cleanup
JobMatchingConfigSchema.index({ "activityLogs.timestamp": 1 }, { expireAfterSeconds: 86400 * 90 } // 90 days
);
exports.JobMatchingConfig = mongoose_1.default.model("JobMatchingConfig", JobMatchingConfigSchema);

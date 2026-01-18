"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobMatchingConfig = getJobMatchingConfig;
exports.updateJobMatchingConfig = updateJobMatchingConfig;
exports.createMatchingProfile = createMatchingProfile;
exports.getMatchingProfiles = getMatchingProfiles;
exports.updateMatchingProfile = updateMatchingProfile;
exports.deleteMatchingProfile = deleteMatchingProfile;
exports.setDefaultProfile = setDefaultProfile;
exports.getAlgorithmStatistics = getAlgorithmStatistics;
exports.updateAlgorithmWeights = updateAlgorithmWeights;
exports.testMatchingConfig = testMatchingConfig;
const JobMatchingConfig_1 = require("../models/JobMatchingConfig");
const AdminActivityLog_1 = require("../models/AdminActivityLog");
/**
 * Get global job matching configuration
 */
async function getJobMatchingConfig(req, res) {
    try {
        let config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        // Create default config if doesn't exist
        if (!config) {
            config = new JobMatchingConfig_1.JobMatchingConfig({
                matchingEnabled: true,
                defaultAlgorithm: "weighted",
                skillWeightFactor: 0.3,
                locationWeightFactor: 0.2,
                salaryWeightFactor: 0.2,
                experienceWeightFactor: 0.15,
                qualificationWeightFactor: 0.15,
            });
            await config.save();
        }
        return res.status(200).json(config);
    }
    catch (error) {
        console.error("getJobMatchingConfig error:", error);
        return res.status(500).json({ message: "Failed to fetch config", error: error.message });
    }
}
/**
 * Update global job matching configuration
 */
async function updateJobMatchingConfig(req, res) {
    try {
        const { matchingEnabled, defaultAlgorithm, skillWeightFactor, locationWeightFactor, salaryWeightFactor, experienceWeightFactor, qualificationWeightFactor, maxConcurrentMatches, cacheMatchResults, cacheTTL, batchProcessingEnabled, batchSize, minJobQualityScore, filterOutExpiredJobs, filterOutDuplicateJobs, trackMatchingHistory, retentionDays, notifyUsersOnNewMatches, notificationFrequency } = req.body;
        if (matchingEnabled !== undefined && typeof matchingEnabled !== "boolean") {
            return res.status(400).json({ message: "matchingEnabled must be boolean" });
        }
        if (defaultAlgorithm && !["weighted", "ml", "hybrid"].includes(defaultAlgorithm)) {
            return res.status(400).json({ message: "Invalid defaultAlgorithm" });
        }
        if (skillWeightFactor !== undefined && (skillWeightFactor < 0 || skillWeightFactor > 1)) {
            return res.status(400).json({ message: "skillWeightFactor must be between 0 and 1" });
        }
        if (minJobQualityScore !== undefined && (minJobQualityScore < 0 || minJobQualityScore > 100)) {
            return res.status(400).json({ message: "minJobQualityScore must be between 0 and 100" });
        }
        if (batchSize !== undefined && (batchSize < 10 || batchSize > 5000)) {
            return res.status(400).json({ message: "batchSize must be between 10 and 5000" });
        }
        let config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        if (!config) {
            config = new JobMatchingConfig_1.JobMatchingConfig();
        }
        // Update only provided fields
        Object.keys(req.body).forEach((key) => {
            if (req.body[key] !== undefined) {
                config[key] = req.body[key];
            }
        });
        await config.save();
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            action: "UPDATE_JOB_MATCHING_CONFIG",
            severity: "MEDIUM",
            userId: req.user?._id,
            changes: {
                updated: Object.keys(req.body),
            },
        });
        return res.status(200).json({ message: "Configuration updated", config });
    }
    catch (error) {
        console.error("updateJobMatchingConfig error:", error);
        return res.status(500).json({ message: "Failed to update config", error: error.message });
    }
}
/**
 * Create a new matching profile
 */
async function createMatchingProfile(req, res) {
    try {
        const { profileName, description, matchingAlgorithm, rules, minimumMatchScore, maxResultsPerQuery, includePartialMatches, boostRecentJobs, recentJobDaysThreshold } = req.body;
        if (!profileName || profileName.trim() === "") {
            return res.status(400).json({ message: "profileName is required" });
        }
        if (!Array.isArray(rules)) {
            return res.status(400).json({ message: "rules must be an array" });
        }
        // Validate rules
        for (const rule of rules) {
            if (!rule.name || !rule.ruleType || !rule.operator) {
                return res.status(400).json({ message: "Each rule must have name, ruleType, and operator" });
            }
            if (!["skill", "location", "salary", "experience", "qualification", "industry", "custom"].includes(rule.ruleType)) {
                return res.status(400).json({ message: `Invalid ruleType: ${rule.ruleType}` });
            }
        }
        let config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        if (!config) {
            config = new JobMatchingConfig_1.JobMatchingConfig();
        }
        const newProfile = {
            profileName,
            description: description || "",
            matchingAlgorithm: matchingAlgorithm || "weighted",
            rules: rules || [],
            minimumMatchScore: Math.min(Math.max(minimumMatchScore || 70, 0), 100),
            maxResultsPerQuery: Math.min(Math.max(maxResultsPerQuery || 50, 1), 1000),
            includePartialMatches: includePartialMatches !== false,
            boostRecentJobs: boostRecentJobs !== false,
            recentJobDaysThreshold: recentJobDaysThreshold || 7,
            enabled: true,
        };
        config.matchingProfiles.push(newProfile);
        // Set as default if it's the first profile
        if (config.matchingProfiles.length === 1) {
            config.defaultProfileId = config.matchingProfiles[0]._id;
        }
        await config.save();
        await AdminActivityLog_1.AdminActivityLog.create({
            action: "CREATE_MATCHING_PROFILE",
            severity: "LOW",
            userId: req.user?._id,
            changes: {
                profileName,
                rulesCount: rules.length,
            },
        });
        const createdProfile = config.matchingProfiles[config.matchingProfiles.length - 1];
        return res.status(201).json({ message: "Profile created", profile: createdProfile });
    }
    catch (error) {
        console.error("createMatchingProfile error:", error);
        return res.status(500).json({ message: "Failed to create profile", error: error.message });
    }
}
/**
 * Get all matching profiles
 */
async function getMatchingProfiles(req, res) {
    try {
        const config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        if (!config) {
            return res.status(200).json({ profiles: [] });
        }
        return res.status(200).json({
            profiles: config.matchingProfiles,
            defaultProfileId: config.defaultProfileId,
        });
    }
    catch (error) {
        console.error("getMatchingProfiles error:", error);
        return res.status(500).json({ message: "Failed to fetch profiles", error: error.message });
    }
}
/**
 * Update a matching profile
 */
async function updateMatchingProfile(req, res) {
    try {
        const { profileId } = req.params;
        const { profileName, description, rules, minimumMatchScore, maxResultsPerQuery, includePartialMatches, boostRecentJobs, recentJobDaysThreshold, enabled } = req.body;
        const config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        if (!config) {
            return res.status(404).json({ message: "Configuration not found" });
        }
        const profileIndex = config.matchingProfiles.findIndex((p) => p._id?.toString() === profileId);
        if (profileIndex === -1) {
            return res.status(404).json({ message: "Profile not found" });
        }
        const profile = config.matchingProfiles[profileIndex];
        if (profileName)
            profile.profileName = profileName;
        if (description)
            profile.description = description;
        if (Array.isArray(rules))
            profile.rules = rules;
        if (minimumMatchScore !== undefined)
            profile.minimumMatchScore = Math.min(Math.max(minimumMatchScore, 0), 100);
        if (maxResultsPerQuery !== undefined)
            profile.maxResultsPerQuery = Math.min(Math.max(maxResultsPerQuery, 1), 1000);
        if (includePartialMatches !== undefined)
            profile.includePartialMatches = includePartialMatches;
        if (boostRecentJobs !== undefined)
            profile.boostRecentJobs = boostRecentJobs;
        if (recentJobDaysThreshold !== undefined)
            profile.recentJobDaysThreshold = recentJobDaysThreshold;
        if (enabled !== undefined)
            profile.enabled = enabled;
        await config.save();
        await AdminActivityLog_1.AdminActivityLog.create({
            action: "UPDATE_MATCHING_PROFILE",
            severity: "LOW",
            userId: req.user?._id,
            changes: {
                profileName,
                profileId,
            },
        });
        return res.status(200).json({ message: "Profile updated", profile });
    }
    catch (error) {
        console.error("updateMatchingProfile error:", error);
        return res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
}
/**
 * Delete a matching profile
 */
async function deleteMatchingProfile(req, res) {
    try {
        const { profileId } = req.params;
        const config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        if (!config) {
            return res.status(404).json({ message: "Configuration not found" });
        }
        const profileIndex = config.matchingProfiles.findIndex((p) => p._id?.toString() === profileId);
        if (profileIndex === -1) {
            return res.status(404).json({ message: "Profile not found" });
        }
        const profileName = config.matchingProfiles[profileIndex].profileName;
        config.matchingProfiles.splice(profileIndex, 1);
        // Reset default if we deleted it
        if (config.defaultProfileId?.toString() === profileId) {
            config.defaultProfileId = config.matchingProfiles.length > 0 ? config.matchingProfiles[0]._id : undefined;
        }
        await config.save();
        await AdminActivityLog_1.AdminActivityLog.create({
            action: "DELETE_MATCHING_PROFILE",
            severity: "MEDIUM",
            userId: req.user?._id,
            changes: {
                profileName,
                profileId,
            },
        });
        return res.status(200).json({ message: "Profile deleted" });
    }
    catch (error) {
        console.error("deleteMatchingProfile error:", error);
        return res.status(500).json({ message: "Failed to delete profile", error: error.message });
    }
}
/**
 * Set default matching profile
 */
async function setDefaultProfile(req, res) {
    try {
        const { profileId } = req.body;
        if (!profileId) {
            return res.status(400).json({ message: "profileId is required" });
        }
        const config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        if (!config) {
            return res.status(404).json({ message: "Configuration not found" });
        }
        const profileExists = config.matchingProfiles.some((p) => p._id?.toString() === profileId);
        if (!profileExists) {
            return res.status(404).json({ message: "Profile not found" });
        }
        config.defaultProfileId = profileId;
        await config.save();
        await AdminActivityLog_1.AdminActivityLog.create({
            action: "SET_DEFAULT_PROFILE",
            severity: "LOW",
            userId: req.user?._id,
            changes: { defaultProfileId: profileId },
        });
        return res.status(200).json({ message: "Default profile updated", defaultProfileId: profileId });
    }
    catch (error) {
        console.error("setDefaultProfile error:", error);
        return res.status(500).json({ message: "Failed to set default profile", error: error.message });
    }
}
/**
 * Get algorithm statistics
 */
async function getAlgorithmStatistics(req, res) {
    try {
        const config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        if (!config) {
            return res.status(404).json({ message: "Configuration not found" });
        }
        return res.status(200).json({
            matchingEnabled: config.matchingEnabled,
            defaultAlgorithm: config.defaultAlgorithm,
            totalJobsMatched: config.totalJobsMatched,
            totalMatchesGenerated: config.totalMatchesGenerated,
            averageMatchScore: config.averageMatchScore,
            lastRunAt: config.lastRunAt,
            profilesCount: config.matchingProfiles.length,
            profilesEnabled: config.matchingProfiles.filter((p) => p.enabled).length,
        });
    }
    catch (error) {
        console.error("getAlgorithmStatistics error:", error);
        return res.status(500).json({ message: "Failed to fetch statistics", error: error.message });
    }
}
/**
 * Update algorithm weights
 */
async function updateAlgorithmWeights(req, res) {
    try {
        const { skillWeightFactor, locationWeightFactor, salaryWeightFactor, experienceWeightFactor, qualificationWeightFactor } = req.body;
        // Validate weights sum to 1
        const weights = [skillWeightFactor || 0.3, locationWeightFactor || 0.2, salaryWeightFactor || 0.2, experienceWeightFactor || 0.15, qualificationWeightFactor || 0.15];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        if (totalWeight === 0) {
            return res.status(400).json({ message: "At least one weight factor must be greater than 0" });
        }
        let config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        if (!config) {
            config = new JobMatchingConfig_1.JobMatchingConfig();
        }
        // Update weights with optional normalization
        if (skillWeightFactor !== undefined)
            config.skillWeightFactor = skillWeightFactor;
        if (locationWeightFactor !== undefined)
            config.locationWeightFactor = locationWeightFactor;
        if (salaryWeightFactor !== undefined)
            config.salaryWeightFactor = salaryWeightFactor;
        if (experienceWeightFactor !== undefined)
            config.experienceWeightFactor = experienceWeightFactor;
        if (qualificationWeightFactor !== undefined)
            config.qualificationWeightFactor = qualificationWeightFactor;
        await config.save();
        await AdminActivityLog_1.AdminActivityLog.create({
            action: "UPDATE_ALGORITHM_WEIGHTS",
            severity: "MEDIUM",
            userId: req.user?._id,
            changes: {
                skillWeightFactor,
                locationWeightFactor,
                salaryWeightFactor,
                experienceWeightFactor,
                qualificationWeightFactor,
            },
        });
        return res.status(200).json({ message: "Weights updated", config: { skillWeightFactor: config.skillWeightFactor, locationWeightFactor: config.locationWeightFactor, salaryWeightFactor: config.salaryWeightFactor, experienceWeightFactor: config.experienceWeightFactor, qualificationWeightFactor: config.qualificationWeightFactor } });
    }
    catch (error) {
        console.error("updateAlgorithmWeights error:", error);
        return res.status(500).json({ message: "Failed to update weights", error: error.message });
    }
}
/**
 * Test matching configuration with sample job
 */
async function testMatchingConfig(req, res) {
    try {
        const { profileId, sampleJob } = req.body;
        if (!profileId || !sampleJob) {
            return res.status(400).json({ message: "profileId and sampleJob are required" });
        }
        const config = await JobMatchingConfig_1.JobMatchingConfig.findOne();
        if (!config) {
            return res.status(404).json({ message: "Configuration not found" });
        }
        const profile = config.matchingProfiles.find((p) => p._id?.toString() === profileId);
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        // Simple weighted matching calculation
        let totalScore = 0;
        let matchedRules = 0;
        profile.rules.forEach((rule) => {
            if (!rule.enabled)
                return;
            let ruleMatches = false;
            // Simple rule evaluation logic
            if (rule.ruleType === "skill" && Array.isArray(sampleJob.requiredSkills)) {
                const skillValue = rule.value;
                ruleMatches = sampleJob.requiredSkills.some((s) => s.toLowerCase().includes(skillValue.toLowerCase()));
            }
            else if (rule.ruleType === "location" && sampleJob.location) {
                const locationValue = rule.value;
                ruleMatches = sampleJob.location.toLowerCase().includes(locationValue.toLowerCase());
            }
            else if (rule.ruleType === "salary" && sampleJob.salary) {
                ruleMatches = true; // Simplified
            }
            if (ruleMatches) {
                totalScore += rule.weight;
                matchedRules++;
            }
        });
        const matchPercentage = profile.rules.length > 0 ? Math.round((totalScore / (profile.rules.length * 100)) * 100) : 0;
        return res.status(200).json({
            matchScore: matchPercentage,
            minimumRequired: profile.minimumMatchScore,
            isMatch: matchPercentage >= profile.minimumMatchScore,
            matchedRules,
            totalRules: profile.rules.length,
            details: {
                jobTitle: sampleJob.title,
                profileName: profile.profileName,
                algorithm: profile.matchingAlgorithm,
            },
        });
    }
    catch (error) {
        console.error("testMatchingConfig error:", error);
        return res.status(500).json({ message: "Failed to test configuration", error: error.message });
    }
}

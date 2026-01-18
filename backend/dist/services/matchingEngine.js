"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchJobAgainstAllResumes = matchJobAgainstAllResumes;
exports.getUserMatchingJobs = getUserMatchingJobs;
exports.getJobMatchDetails = getJobMatchDetails;
exports.markMatchesAsNotified = markMatchesAsNotified;
exports.getUnnotifiedMatches = getUnnotifiedMatches;
const ResumeEmbedding_1 = require("../models/ResumeEmbedding");
const JobMatch_1 = require("../models/JobMatch");
const embeddingService_1 = require("./embeddingService");
/**
 * Match a single job against all user resumes
 * @param jobId - Job ID to match
 * @param jobEmbedding - Job embedding vector
 * @returns Array of matching users and their scores
 */
async function matchJobAgainstAllResumes(jobId, jobEmbedding) {
    try {
        // Get all resume embeddings
        const resumeEmbeddings = await ResumeEmbedding_1.ResumeEmbedding.find().lean();
        if (resumeEmbeddings.length === 0) {
            console.log("No resume embeddings found");
            return [];
        }
        const matches = [];
        // Compare job embedding against each resume
        for (const resumeEmbed of resumeEmbeddings) {
            try {
                const similarity = (0, embeddingService_1.cosineSimilarity)(jobEmbedding, resumeEmbed.embedding);
                const matchScore = (0, embeddingService_1.similarityToMatchScore)(similarity);
                // Only save matches that meet threshold (70%)
                if ((0, embeddingService_1.meetsMatchThreshold)(similarity)) {
                    matches.push({
                        userId: resumeEmbed.userId.toString(),
                        jobId,
                        matchScore,
                        similarityScore: similarity,
                    });
                    // Save to JobMatch collection
                    await JobMatch_1.JobMatch.findOneAndUpdate({ userId: resumeEmbed.userId, jobId }, {
                        userId: resumeEmbed.userId,
                        jobId,
                        matchScore,
                        similarityScore: similarity,
                        notified: false,
                    }, { upsert: true, new: true });
                }
            }
            catch (error) {
                console.error(`Error comparing job ${jobId} with resume ${resumeEmbed.userId}:`, error);
            }
        }
        return matches;
    }
    catch (error) {
        console.error("Error matching job against resumes:", error);
        throw error;
    }
}
/**
 * Get all matching jobs for a user
 * @param userId - User ID
 * @param minScore - Minimum match score (default 70)
 * @returns Array of matching jobs sorted by score
 */
async function getUserMatchingJobs(userId, minScore = 70) {
    try {
        const matches = await JobMatch_1.JobMatch.find({
            userId,
            matchScore: { $gte: minScore },
        })
            .sort({ matchScore: -1 })
            .populate("jobId")
            .lean();
        return matches.map((m) => ({
            ...m.jobId,
            matchScore: m.matchScore,
            similarityScore: m.similarityScore,
        }));
    }
    catch (error) {
        console.error("Error getting user matching jobs:", error);
        throw error;
    }
}
/**
 * Get match details between user resume and job
 * @param userId - User ID
 * @param jobId - Job ID
 * @returns Match details or null
 */
async function getJobMatchDetails(userId, jobId) {
    try {
        return await JobMatch_1.JobMatch.findOne({ userId, jobId }).lean();
    }
    catch (error) {
        console.error("Error getting match details:", error);
        throw error;
    }
}
/**
 * Mark matches as notified
 * @param matches - Array of { userId, jobId }
 */
async function markMatchesAsNotified(matches) {
    try {
        const promises = matches.map((m) => JobMatch_1.JobMatch.updateOne({ userId: m.userId, jobId: m.jobId }, {
            notified: true,
            notificationSentAt: new Date(),
        }));
        await Promise.all(promises);
    }
    catch (error) {
        console.error("Error marking matches as notified:", error);
        throw error;
    }
}
/**
 * Get unnotified matches for a job (new matches)
 * @param jobId - Job ID
 * @returns Unnotified matches
 */
async function getUnnotifiedMatches(jobId) {
    try {
        return await JobMatch_1.JobMatch.find({
            jobId,
            notified: false,
        })
            .populate("userId", "email name notificationPrefs")
            .lean();
    }
    catch (error) {
        console.error("Error getting unnotified matches:", error);
        throw error;
    }
}

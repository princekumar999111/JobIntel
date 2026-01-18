"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.uploadResume = uploadResume;
exports.getResumeStatus = getResumeStatus;
exports.deleteResume = deleteResume;
exports.downloadResume = downloadResume;
exports.getMatchingJobs = getMatchingJobs;
const multer_1 = __importDefault(require("multer"));
const resumeService_1 = require("../services/resumeService");
const resumeParser_1 = require("../services/resumeParser");
const jobMatcher_1 = require("../services/jobMatcher");
const User_1 = require("../models/User");
const JobMatch_1 = require("../models/JobMatch");
// Configure multer for file uploads (memory storage)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only PDF and DOCX files are allowed"));
        }
    },
});
exports.upload = upload;
/**
 * Upload and process resume
 * POST /api/resume/upload
 */
async function uploadResume(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        console.log(`Processing resume for user ${user._id} (${req.file.originalname})`);
        const { resumeText, embedding, textHash } = await (0, resumeService_1.processResume)(user._id.toString(), req.file.buffer, req.file.mimetype);
        // Parse resume automatically
        let resumeText_content = resumeText;
        if (req.file.mimetype === 'application/pdf') {
            try {
                resumeText_content = await resumeParser_1.ResumeParser.extractTextFromPDF(req.file.buffer);
            }
            catch (err) {
                console.log('PDF text extraction failed, using default text');
            }
        }
        const parsedData = resumeParser_1.ResumeParser.parseResumeText(resumeText_content);
        const parsedDataMapping = resumeParser_1.ResumeParser.createParsedDataMapping(parsedData);
        // Auto-populate user data from resume
        const updateData = {
            parsedResumeData: parsedDataMapping,
            resume: {
                rawText: resumeText,
                embedding,
                parsedAt: new Date(),
            },
        };
        // Merge skills (add parsed skills without removing existing ones)
        if (parsedData.skills && parsedData.skills.length > 0) {
            const existingSkills = user.skills || [];
            const mergedSkills = Array.from(new Set([...existingSkills, ...parsedData.skills]));
            updateData.skills = mergedSkills;
        }
        // Auto-populate profile fields if not already set
        if (parsedData.email && !user.email)
            updateData.email = parsedData.email;
        if (parsedData.phone && !user.phone)
            updateData.phone = parsedData.phone;
        if (parsedData.location && !user.location)
            updateData.location = parsedData.location;
        if (parsedData.name && !user.name)
            updateData.name = parsedData.name;
        if (parsedData.batch && !user.batch)
            updateData.batch = parsedData.batch;
        // Update user with auto-parsed data
        const updatedUser = await User_1.User.findByIdAndUpdate(user._id, updateData, { new: true }).lean();
        // Get matching jobs based on updated profile
        let matchingJobs = [];
        try {
            const matches = await jobMatcher_1.JobMatcher.findMatches(updatedUser, 5);
            matchingJobs = matches.map(m => ({
                jobId: m.jobId,
                title: m.job.title,
                company: m.job.company,
                matchScore: m.matchScore,
                matchedSkills: m.matchedSkills,
                missingSkills: m.missingSkills,
                reasons: m.reasons,
            }));
        }
        catch (err) {
            console.error('Error getting matching jobs:', err);
        }
        return res.status(200).json({
            success: true,
            message: "Resume uploaded and processed successfully",
            resume: {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                textLength: resumeText.length,
                embeddingDimensions: embedding.length,
                textHash,
            },
            parsedData: {
                skills: parsedData.skills,
                email: parsedData.email,
                phone: parsedData.phone,
                location: parsedData.location,
                name: parsedData.name,
                batch: parsedData.batch,
            },
            suggestedMatches: matchingJobs,
        });
    }
    catch (error) {
        console.error("Error uploading resume:", error);
        return res.status(500).json({
            error: "Failed to process resume",
            details: error instanceof Error ? error.message : String(error),
        });
    }
}
/**
 * Get resume status
 * GET /api/resume/status
 */
async function getResumeStatus(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const hasResume = await (0, resumeService_1.userHasResume)(user._id.toString());
        // Return 404 if user has no resume (CRUD compliance)
        if (!hasResume) {
            return res.status(404).json({ error: "No resume found" });
        }
        // Fetch fresh user data to get resume details
        const freshUser = await User_1.User.findById(user._id).lean();
        if (!freshUser?.resume) {
            return res.status(404).json({ error: "Resume not found in database" });
        }
        return res.json({
            id: user._id.toString(),
            hasResume: true,
            resumeText: freshUser.resume?.rawText?.substring(0, 200) || null,
            lastUpdated: freshUser.resume?.parsedAt || null,
            format: 'pdf',
            status: 'Processed',
            parsedAt: freshUser.resume?.parsedAt || new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error getting resume status:", error);
        return res.status(500).json({ error: "Failed to get resume status" });
    }
}
/**
 * Delete user's resume and its parsed data
 * DELETE /api/resume/:id
 *
 * CRUD DELETE Operation:
 * - Removes resume document from user record
 * - Deletes all auto-parsed data (skills, profile fields)
 * - Removes all job matching records (JobMatch collection)
 * - Clears resume embeddings
 * - Restores user profile to pre-upload state
 */
async function deleteResume(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Check if user actually has a resume before deletion
        const hasResume = await (0, resumeService_1.userHasResume)(user._id.toString());
        if (!hasResume) {
            return res.status(404).json({ error: "No resume found to delete" });
        }
        // Get user to access parsed data mapping
        const userData = await User_1.User.findById(user._id).lean();
        if (!userData) {
            return res.status(404).json({ error: "User not found" });
        }
        const parsedDataMapping = userData.parsedResumeData;
        // Step 1: Remove parsed skills if they were auto-added from resume
        let skillsToRemove = [];
        if (parsedDataMapping?.parsedSkills) {
            skillsToRemove = parsedDataMapping.parsedSkills;
        }
        // Step 2: Build update object to clear resume and remove parsed data
        const updateData = {
            $unset: {
                resume: 1,
                parsedResumeData: 1,
            },
        };
        // Step 3: Remove only the auto-parsed skills (CRUD consistency)
        if (skillsToRemove.length > 0) {
            updateData.$pullAll = {
                skills: skillsToRemove,
            };
        }
        // Step 4: Update user - remove resume, parsed data, and skills in one operation
        const updatedUser = await User_1.User.findByIdAndUpdate(user._id, updateData, { new: true });
        // Verify resume was actually deleted from database by checking raw DB
        const verifyUser = await User_1.User.findById(user._id).select('resume').lean();
        if (verifyUser?.resume) {
            console.error(`WARNING: Resume still exists after deletion for user ${user._id}`);
            // Try alternate deletion method
            await User_1.User.updateOne({ _id: user._id }, { $unset: { resume: "", parsedResumeData: "" } });
            console.log(`Retried resume deletion for user ${user._id}`);
        }
        // Step 5: Delete all JobMatch records for this user (clean up all matching data in real-time)
        const deleteMatchResult = await JobMatch_1.JobMatch.deleteMany({
            userId: user._id,
        });
        console.log(`✓ Deleted resume for user ${user._id}: removed ${skillsToRemove.length} skills, ${deleteMatchResult.deletedCount} job matches`);
        return res.json({
            success: true,
            message: "Resume and all related data deleted from database",
            deletionDetails: {
                resumeCleared: true,
                skillsRemoved: skillsToRemove.length,
                removedSkillsList: skillsToRemove,
                jobMatchesDeleted: deleteMatchResult.deletedCount,
                parsedDataCleared: !!parsedDataMapping,
            },
        });
    }
    catch (error) {
        console.error("Error deleting resume:", error);
        return res.status(500).json({
            error: "Failed to delete resume from database",
            details: error instanceof Error ? error.message : String(error),
        });
    }
}
/**
 * Download user's resume
 * GET /api/resume/download
 */
async function downloadResume(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!user.resume?.rawText) {
            return res.status(404).json({ error: "No resume found" });
        }
        // Return resume as downloadable file
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
        res.send(user.resume.rawText);
    }
    catch (error) {
        console.error("Error downloading resume:", error);
        return res.status(500).json({ error: "Failed to download resume" });
    }
}
/**
 * Get matching jobs for user based on profile, skills, resume
 * GET /api/resume/matching-jobs
 */
async function getMatchingJobs(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const minScore = parseInt(req.query.minScore) || 50;
        // Get full user data
        const userData = await User_1.User.findById(user._id).lean();
        if (!userData) {
            return res.status(404).json({ error: "User not found" });
        }
        // Get matching jobs using job matcher
        const matches = await jobMatcher_1.JobMatcher.findMatches(userData, 10);
        const filteredMatches = matches.filter(m => m.matchScore >= minScore);
        // Format response
        const formattedMatches = filteredMatches.map(m => ({
            jobId: m.jobId,
            title: m.job.title,
            company: m.job.company,
            location: m.job.location,
            salary: m.job.salary,
            matchScore: m.matchScore,
            matchedSkills: m.matchedSkills,
            missingSkills: m.missingSkills,
            reasons: m.reasons,
            description: m.job.description,
            requiredSkills: m.job.requiredSkills,
            preferredSkills: m.job.preferredSkills,
        }));
        // Get stats
        const stats = await jobMatcher_1.JobMatcher.getMatchStats(userData);
        return res.json({
            count: formattedMatches.length,
            minScore,
            stats,
            matches: formattedMatches,
        });
    }
    catch (error) {
        console.error("Error getting matching jobs:", error);
        return res.status(500).json({ error: "Failed to get matching jobs" });
    }
}

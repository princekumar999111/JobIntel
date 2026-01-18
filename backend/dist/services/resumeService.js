"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResumeFile = parseResumeFile;
exports.processResume = processResume;
exports.getResumeEmbedding = getResumeEmbedding;
exports.userHasResume = userHasResume;
const User_1 = require("../models/User");
const ResumeEmbedding_1 = require("../models/ResumeEmbedding");
const embeddingService_1 = require("./embeddingService");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
/**
 * Parse PDF or DOCX resume text
 * @param buffer - File buffer
 * @param mimeType - File MIME type
 * @returns Extracted text
 */
async function parseResumeFile(buffer, mimeType) {
    try {
        if (mimeType === "application/pdf") {
            const pdf = await (0, pdf_parse_1.default)(buffer);
            return pdf.text;
        }
        else if (mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimeType === "application/msword") {
            const result = await mammoth_1.default.extractRawText({ buffer });
            return result.value;
        }
        else {
            throw new Error("Unsupported file type. Only PDF and DOCX are supported.");
        }
    }
    catch (error) {
        console.error("Error parsing resume file:", error);
        throw error;
    }
}
/**
 * Process resume: parse, extract text, generate embedding
 * @param userId - User ID
 * @param buffer - File buffer
 * @param mimeType - File MIME type
 * @returns { resumeText, embedding, textHash }
 */
async function processResume(userId, buffer, mimeType) {
    try {
        // Parse resume file
        const resumeText = await parseResumeFile(buffer, mimeType);
        if (!resumeText || resumeText.trim().length === 0) {
            throw new Error("Resume file is empty");
        }
        // Generate hash to detect changes
        const textHash = (0, embeddingService_1.hashText)(resumeText);
        // Generate embedding
        console.log(`Generating embedding for user ${userId}...`);
        const embedding = await (0, embeddingService_1.getEmbedding)(resumeText);
        // Update user with resume text
        await User_1.User.findByIdAndUpdate(userId, {
            resume: {
                rawText: resumeText,
                parsedAt: new Date(),
            },
        });
        // Save or update embedding
        await ResumeEmbedding_1.ResumeEmbedding.findOneAndUpdate({ userId }, {
            userId,
            embedding,
            textHash,
        }, { upsert: true, new: true });
        console.log(`Resume processed successfully for user ${userId}`);
        return { resumeText, embedding, textHash };
    }
    catch (error) {
        console.error("Error processing resume:", error);
        throw error;
    }
}
/**
 * Get resume embedding for user (without re-processing)
 * @param userId - User ID
 * @returns Embedding or null if not found
 */
async function getResumeEmbedding(userId) {
    return ResumeEmbedding_1.ResumeEmbedding.findOne({ userId }).lean();
}
/**
 * Check if user has resume
 * @param userId - User ID
 * @returns true if user has resume text
 */
async function userHasResume(userId) {
    const user = await User_1.User.findById(userId).select("resume").lean();
    return !!(user?.resume?.rawText && user.resume.rawText.trim().length > 0);
}

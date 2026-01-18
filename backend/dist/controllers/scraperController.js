"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheSalaryData = exports.getSalaryData = exports.isJobSaved = exports.removeSavedJob = exports.saveJob = exports.getSavedJobs = exports.deleteSearch = exports.saveSearch = exports.getSearchHistory = void 0;
const ScraperData_1 = require("../models/ScraperData");
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)('jobintel:scraper-controller');
/**
 * Get user's search history
 */
const getSearchHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const searches = await ScraperData_1.ScraperSearch.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await ScraperData_1.ScraperSearch.countDocuments({ userId });
        res.json({
            success: true,
            data: searches,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        log('Error getting search history:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.getSearchHistory = getSearchHistory;
/**
 * Save search results
 */
const saveSearch = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { query, country, employmentType, datePosted, remoteOnly, page, numPages, results, } = req.body;
        const search = new ScraperData_1.ScraperSearch({
            userId,
            query,
            country,
            employmentType,
            datePosted,
            remoteOnly,
            page,
            numPages,
            resultCount: results?.length || 0,
            results,
        });
        await search.save();
        log(`✅ Search saved: ${query} in ${country}`);
        res.json({
            success: true,
            data: search,
            message: `Search saved with ${search.resultCount} results`,
        });
    }
    catch (error) {
        log('Error saving search:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.saveSearch = saveSearch;
/**
 * Delete search from history
 */
const deleteSearch = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { searchId } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const search = await ScraperData_1.ScraperSearch.findOneAndDelete({
            _id: searchId,
            userId,
        });
        if (!search) {
            return res
                .status(404)
                .json({ success: false, error: 'Search not found' });
        }
        res.json({
            success: true,
            message: 'Search deleted successfully',
        });
    }
    catch (error) {
        log('Error deleting search:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.deleteSearch = deleteSearch;
/**
 * Get saved jobs
 */
const getSavedJobs = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const savedJobs = await ScraperData_1.SavedJob.find({ userId })
            .sort({ savedAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await ScraperData_1.SavedJob.countDocuments({ userId });
        res.json({
            success: true,
            data: savedJobs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        log('Error getting saved jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.getSavedJobs = getSavedJobs;
/**
 * Save a job
 */
const saveJob = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { jobId, jobTitle, company, location, salary, jobLink, source = 'linkedin', notes, } = req.body;
        // Check if already saved
        const existing = await ScraperData_1.SavedJob.findOne({ userId, jobId });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Job already saved',
            });
        }
        const savedJob = new ScraperData_1.SavedJob({
            userId,
            jobId,
            jobTitle,
            company,
            location,
            salary,
            jobLink,
            source,
            notes,
        });
        await savedJob.save();
        log(`✅ Job saved: ${jobTitle} at ${company}`);
        res.json({
            success: true,
            data: savedJob,
            message: 'Job saved successfully',
        });
    }
    catch (error) {
        log('Error saving job:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.saveJob = saveJob;
/**
 * Remove saved job
 */
const removeSavedJob = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { jobId } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const result = await ScraperData_1.SavedJob.findOneAndDelete({
            userId,
            jobId,
        });
        if (!result) {
            return res
                .status(404)
                .json({ success: false, error: 'Saved job not found' });
        }
        res.json({
            success: true,
            message: 'Job removed from saved',
        });
    }
    catch (error) {
        log('Error removing saved job:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.removeSavedJob = removeSavedJob;
/**
 * Check if job is saved
 */
const isJobSaved = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { jobId } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const saved = await ScraperData_1.SavedJob.findOne({ userId, jobId });
        res.json({
            success: true,
            saved: !!saved,
            data: saved || null,
        });
    }
    catch (error) {
        log('Error checking saved job:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.isJobSaved = isJobSaved;
/**
 * Get salary query history/cache
 */
const getSalaryData = async (req, res) => {
    try {
        const { jobTitle, location, experienceLevel } = req.query;
        if (!jobTitle || !location) {
            return res.status(400).json({
                success: false,
                error: 'Job title and location are required',
            });
        }
        const query = {
            jobTitle,
            location,
        };
        if (experienceLevel) {
            query.experienceLevel = experienceLevel;
        }
        const salaryData = await ScraperData_1.ScraperSalaryQuery.findOne(query);
        if (!salaryData) {
            return res.status(404).json({
                success: false,
                error: 'Salary data not found',
            });
        }
        res.json({
            success: true,
            data: salaryData,
        });
    }
    catch (error) {
        log('Error getting salary data:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.getSalaryData = getSalaryData;
/**
 * Cache salary query result
 */
const cacheSalaryData = async (req, res) => {
    try {
        const { jobTitle, location, experienceLevel, company, salaryData, } = req.body;
        let query = await ScraperData_1.ScraperSalaryQuery.findOne({
            jobTitle,
            location,
            experienceLevel,
            company,
        });
        if (query) {
            query.salaryData = salaryData;
            query.queried += 1;
            query.lastQueried = new Date();
            await query.save();
        }
        else {
            query = new ScraperData_1.ScraperSalaryQuery({
                jobTitle,
                location,
                experienceLevel,
                company,
                salaryData,
                queried: 1,
            });
            await query.save();
        }
        log(`✅ Salary data cached: ${jobTitle} in ${location}`);
        res.json({
            success: true,
            data: query,
        });
    }
    catch (error) {
        log('Error caching salary data:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.cacheSalaryData = cacheSalaryData;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredJobs = exports.getJobStats = exports.markJobAsApplied = exports.getJobById = exports.getFresherJobs = exports.getJobsByDomain = exports.getFreshJobs = exports.getTrendingJobs = exports.searchJobs = void 0;
const jobSearch_1 = require("../services/jobSearch");
const searchService = new jobSearch_1.JobSearchService();
/**
 * User/Public: Search and filter jobs
 */
const searchJobs = async (req, res) => {
    try {
        const { careerLevel, domain, role, techStack, employmentType, workMode, search, sortBy = 'recent', page = 1, limit = 20 } = req.query;
        const filters = {
            page: parseInt(page),
            limit: Math.min(parseInt(limit) || 20, 100),
            sortBy: sortBy,
            searchText: search
        };
        if (careerLevel)
            filters.careerLevel = careerLevel;
        if (domain)
            filters.domain = domain;
        if (role)
            filters.role = role;
        if (employmentType)
            filters.employmentType = employmentType;
        if (workMode)
            filters.workMode = workMode;
        if (techStack) {
            filters.techStack = Array.isArray(techStack)
                ? techStack
                : techStack.split(',');
        }
        const result = await searchService.searchJobs(filters);
        res.json({
            success: true,
            data: result.jobs,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error('Error searching jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to search jobs'
        });
    }
};
exports.searchJobs = searchJobs;
/**
 * User: Get trending jobs
 */
const getTrendingJobs = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const jobs = await searchService.getTrendingJobs(limit);
        res.json({
            success: true,
            data: jobs,
            count: jobs.length
        });
    }
    catch (error) {
        console.error('Error fetching trending jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch trending jobs'
        });
    }
};
exports.getTrendingJobs = getTrendingJobs;
/**
 * User: Get fresh jobs (most recent)
 */
const getFreshJobs = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const jobs = await searchService.getFreshJobs(limit);
        res.json({
            success: true,
            data: jobs,
            count: jobs.length
        });
    }
    catch (error) {
        console.error('Error fetching fresh jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch fresh jobs'
        });
    }
};
exports.getFreshJobs = getFreshJobs;
/**
 * User: Get jobs by domain
 */
const getJobsByDomain = async (req, res) => {
    try {
        const { domain } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const result = await searchService.getJobsByDomain(domain, limit, page);
        res.json({
            success: true,
            data: result.jobs,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error('Error fetching domain jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch domain jobs'
        });
    }
};
exports.getJobsByDomain = getJobsByDomain;
/**
 * User: Get fresher jobs
 */
const getFresherJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const result = await searchService.getFresherJobs(limit, page);
        res.json({
            success: true,
            data: result.jobs,
            pagination: result.pagination,
            note: 'Fresher-focused jobs with 0-1 years experience requirement'
        });
    }
    catch (error) {
        console.error('Error fetching fresher jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch fresher jobs'
        });
    }
};
exports.getFresherJobs = getFresherJobs;
/**
 * User: Get job by ID
 */
const getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await searchService.getJobById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }
        // Increment view count
        await searchService.incrementViewCount(jobId);
        res.json({
            success: true,
            data: job
        });
    }
    catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch job'
        });
    }
};
exports.getJobById = getJobById;
/**
 * User: Mark job as applied
 */
const markJobAsApplied = async (req, res) => {
    try {
        const { jobId } = req.params;
        await searchService.incrementAppliedCount(jobId);
        res.json({
            success: true,
            message: 'Job marked as applied'
        });
    }
    catch (error) {
        console.error('Error marking job as applied:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to mark job as applied'
        });
    }
};
exports.markJobAsApplied = markJobAsApplied;
/**
 * User: Get job statistics (public)
 */
const getJobStats = async (req, res) => {
    try {
        const stats = await searchService.getJobStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching job stats:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch job statistics'
        });
    }
};
exports.getJobStats = getJobStats;
/**
 * Admin: Cleanup expired jobs
 */
const cleanupExpiredJobs = async (req, res) => {
    try {
        const result = await searchService.cleanupExpiredJobs();
        res.json({
            success: true,
            message: `Cleaned up ${result.modifiedCount} expired jobs`,
            modifiedCount: result.modifiedCount
        });
    }
    catch (error) {
        console.error('Error cleaning up expired jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to cleanup expired jobs'
        });
    }
};
exports.cleanupExpiredJobs = cleanupExpiredJobs;

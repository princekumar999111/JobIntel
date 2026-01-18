"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSearchService = void 0;
const ScrapedJob_1 = require("../models/ScrapedJob");
class JobSearchService {
    defaultLimit = 20;
    defaultPage = 1;
    /**
     * Build MongoDB filter query
     */
    buildFilterQuery(filters) {
        const query = {
            archived: false,
            expiryDate: { $gt: new Date() } // Only non-expired jobs
        };
        if (filters.careerLevel) {
            query['tags.careerLevel'] = filters.careerLevel;
        }
        if (filters.domain) {
            query['tags.domain'] = filters.domain;
        }
        if (filters.role) {
            query['tags.role'] = new RegExp(filters.role, 'i'); // Case-insensitive
        }
        if (filters.employmentType) {
            query['tags.employmentType'] = filters.employmentType;
        }
        if (filters.workMode) {
            query['tags.workMode'] = filters.workMode;
        }
        // Tech stack - match if ANY of the provided techs are in job's stack
        if (filters.techStack && filters.techStack.length > 0) {
            query['tags.techStack'] = { $in: filters.techStack };
        }
        // Full text search across title, company, description
        if (filters.searchText) {
            const searchRegex = new RegExp(filters.searchText, 'i');
            query.$or = [
                { title: searchRegex },
                { company: searchRegex },
                { description: searchRegex }
            ];
        }
        return query;
    }
    /**
     * Search and filter jobs
     */
    async searchJobs(filters) {
        const page = filters.page || this.defaultPage;
        const limit = Math.min(filters.limit || this.defaultLimit, 100); // Max 100 per page
        const skip = (page - 1) * limit;
        // Build query
        const query = this.buildFilterQuery(filters);
        // Build sort
        const sort = {};
        if (filters.sortBy === 'recent') {
            sort.fetchedAt = -1; // Newest first
        }
        else if (filters.sortBy === 'popular') {
            sort.viewCount = -1;
            sort.appliedCount = -1;
        }
        else {
            sort.fetchedAt = -1; // Default to recent
        }
        // Execute query
        const [jobs, total] = await Promise.all([
            ScrapedJob_1.ScrapedJob.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            ScrapedJob_1.ScrapedJob.countDocuments(query)
        ]);
        return {
            jobs: jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: skip + limit < total,
                hasPreviousPage: page > 1
            }
        };
    }
    /**
     * Get trending jobs (most popular)
     */
    async getTrendingJobs(limit = 10) {
        const jobs = await ScrapedJob_1.ScrapedJob.find({
            archived: false,
            expiryDate: { $gt: new Date() }
        })
            .sort({ appliedCount: -1, viewCount: -1, fetchedAt: -1 })
            .limit(limit)
            .lean()
            .exec();
        return jobs;
    }
    /**
     * Get fresh jobs (most recent)
     */
    async getFreshJobs(limit = 10) {
        const jobs = await ScrapedJob_1.ScrapedJob.find({
            archived: false,
            expiryDate: { $gt: new Date() }
        })
            .sort({ fetchedAt: -1 })
            .limit(limit)
            .lean()
            .exec();
        return jobs;
    }
    /**
     * Get jobs by specific domain
     */
    async getJobsByDomain(domain, limit = 20, page = 1) {
        return this.searchJobs({
            domain: domain,
            limit,
            page,
            sortBy: 'recent'
        });
    }
    /**
     * Get fresher-focused jobs
     */
    async getFresherJobs(limit = 20, page = 1) {
        return this.searchJobs({
            careerLevel: 'fresher',
            limit,
            page,
            sortBy: 'recent'
        });
    }
    /**
     * Get jobs matching multiple criteria (AND logic)
     */
    async getMatchingJobs(careerLevel, domains, roles, techStack, workMode, limit = 20, page = 1) {
        const query = {
            archived: false,
            expiryDate: { $gt: new Date() }
        };
        if (careerLevel) {
            query['tags.careerLevel'] = careerLevel;
        }
        if (domains && domains.length > 0) {
            query['tags.domain'] = { $in: domains };
        }
        if (roles && roles.length > 0) {
            const roleQueries = roles.map(role => ({
                'tags.role': new RegExp(role, 'i')
            }));
            query.$or = roleQueries;
        }
        if (techStack && techStack.length > 0) {
            query['tags.techStack'] = { $in: techStack };
        }
        if (workMode) {
            query['tags.workMode'] = workMode;
        }
        const skip = (page - 1) * limit;
        const [jobs, total] = await Promise.all([
            ScrapedJob_1.ScrapedJob.find(query)
                .sort({ fetchedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            ScrapedJob_1.ScrapedJob.countDocuments(query)
        ]);
        return {
            jobs: jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: skip + limit < total,
                hasPreviousPage: page > 1
            }
        };
    }
    /**
     * Get job statistics
     */
    async getJobStats() {
        const [totalJobs, fresherJobs, batchJobs, remoteJobs, hybridJobs, onsiteJobs, fullTimeJobs, internshipJobs, expiredJobs] = await Promise.all([
            ScrapedJob_1.ScrapedJob.countDocuments({ archived: false, expiryDate: { $gt: new Date() } }),
            ScrapedJob_1.ScrapedJob.countDocuments({
                archived: false,
                expiryDate: { $gt: new Date() },
                'tags.careerLevel': 'fresher'
            }),
            ScrapedJob_1.ScrapedJob.countDocuments({
                archived: false,
                expiryDate: { $gt: new Date() },
                'tags.batchEligibility': { $exists: true, $ne: [] }
            }),
            ScrapedJob_1.ScrapedJob.countDocuments({
                archived: false,
                expiryDate: { $gt: new Date() },
                'tags.workMode': 'remote'
            }),
            ScrapedJob_1.ScrapedJob.countDocuments({
                archived: false,
                expiryDate: { $gt: new Date() },
                'tags.workMode': 'hybrid'
            }),
            ScrapedJob_1.ScrapedJob.countDocuments({
                archived: false,
                expiryDate: { $gt: new Date() },
                'tags.workMode': 'onsite'
            }),
            ScrapedJob_1.ScrapedJob.countDocuments({
                archived: false,
                expiryDate: { $gt: new Date() },
                'tags.employmentType': 'full-time'
            }),
            ScrapedJob_1.ScrapedJob.countDocuments({
                archived: false,
                expiryDate: { $gt: new Date() },
                'tags.employmentType': 'internship'
            }),
            ScrapedJob_1.ScrapedJob.countDocuments({
                archived: false,
                expiryDate: { $lte: new Date() }
            })
        ]);
        // Domain breakdown
        const domainStats = await ScrapedJob_1.ScrapedJob.aggregate([
            {
                $match: {
                    archived: false,
                    expiryDate: { $gt: new Date() }
                }
            },
            {
                $group: {
                    _id: '$tags.domain',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        return {
            totalJobs,
            fresherJobs,
            batchJobs,
            workMode: {
                remote: remoteJobs,
                hybrid: hybridJobs,
                onsite: onsiteJobs
            },
            employmentType: {
                fullTime: fullTimeJobs,
                internship: internshipJobs
            },
            expiredJobs,
            domains: domainStats.reduce((acc, item) => {
                acc[item._id || 'other'] = item.count;
                return acc;
            }, {})
        };
    }
    /**
     * Increment view count for a job
     */
    async incrementViewCount(jobId) {
        await ScrapedJob_1.ScrapedJob.findByIdAndUpdate(jobId, { $inc: { viewCount: 1 } }, { new: true });
    }
    /**
     * Increment applied count for a job
     */
    async incrementAppliedCount(jobId) {
        await ScrapedJob_1.ScrapedJob.findByIdAndUpdate(jobId, { $inc: { appliedCount: 1 } }, { new: true });
    }
    /**
     * Archive a job
     */
    async archiveJob(jobId) {
        await ScrapedJob_1.ScrapedJob.findByIdAndUpdate(jobId, { archived: true }, { new: true });
    }
    /**
     * Get a single job by ID
     */
    async getJobById(jobId) {
        return ScrapedJob_1.ScrapedJob.findById(jobId).lean();
    }
    /**
     * Cleanup expired jobs (run periodically)
     */
    async cleanupExpiredJobs() {
        const result = await ScrapedJob_1.ScrapedJob.updateMany({
            expiryDate: { $lte: new Date() },
            archived: false
        }, {
            archived: true
        });
        return {
            modifiedCount: result.modifiedCount
        };
    }
}
exports.JobSearchService = JobSearchService;

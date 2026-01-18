"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScrapingHistory = exports.scrapeAllBuckets = exports.scrapeFresherPriority = exports.scrapeBucket = exports.checkAPIUsage = exports.getBucketDetails = exports.getAvailableBuckets = void 0;
const jobScraper_1 = require("../services/jobScraper");
const roleBuckets_1 = require("../services/roleBuckets");
const mongoose_1 = __importDefault(require("mongoose"));
const scraper = new jobScraper_1.JobScraperService();
/**
 * Admin: Get available role buckets
 */
const getAvailableBuckets = async (req, res) => {
    try {
        const withStats = req.query.stats === 'true';
        let buckets = roleBuckets_1.ROLE_BUCKETS;
        if (req.query.priority === 'fresher') {
            buckets = (0, roleBuckets_1.getFresherPriority)();
        }
        else if (req.query.priority === 'primary') {
            buckets = (0, roleBuckets_1.getPrimaryBuckets)();
        }
        if (withStats) {
            const bucketStats = buckets.map(b => ({
                ...b,
                keywordCount: b.keywords.length
            }));
            return res.json(bucketStats);
        }
        res.json(buckets);
    }
    catch (error) {
        console.error('Error fetching buckets:', error);
        res.status(500).json({ error: 'Failed to fetch role buckets' });
    }
};
exports.getAvailableBuckets = getAvailableBuckets;
/**
 * Admin: Get specific bucket details
 */
const getBucketDetails = async (req, res) => {
    try {
        const { bucketId } = req.params;
        const bucket = roleBuckets_1.ROLE_BUCKETS.find(b => b.id === bucketId);
        if (!bucket) {
            return res.status(404).json({ error: 'Bucket not found' });
        }
        res.json({
            ...bucket,
            keywordCount: bucket.keywords.length
        });
    }
    catch (error) {
        console.error('Error fetching bucket details:', error);
        res.status(500).json({ error: 'Failed to fetch bucket details' });
    }
};
exports.getBucketDetails = getBucketDetails;
/**
 * Admin: Check API usage limits
 */
const checkAPIUsage = async (req, res) => {
    try {
        const canCall = await scraper.canMakeAPICall();
        const summary = await scraper.getUsageSummary();
        res.json({
            canMakeCall: canCall.allowed,
            limitStatus: canCall,
            summary
        });
    }
    catch (error) {
        console.error('Error checking API usage:', error);
        res.status(500).json({ error: 'Failed to check API usage' });
    }
};
exports.checkAPIUsage = checkAPIUsage;
/**
 * Admin: Scrape a specific role bucket
 */
const scrapeBucket = async (req, res) => {
    try {
        const { bucketId } = req.params;
        const userId = req.user?._id || new mongoose_1.default.Types.ObjectId();
        // Check if can make API call
        const canCall = await scraper.canMakeAPICall();
        if (!canCall.allowed) {
            return res.status(429).json({
                error: canCall.reason,
                usage: canCall
            });
        }
        // Scrape the bucket
        const result = await scraper.scrapeBucket(bucketId, userId);
        if (!result.success) {
            return res.status(400).json({
                error: 'Scraping failed',
                details: result
            });
        }
        res.json({
            success: true,
            message: `Successfully scraped ${bucketId}`,
            details: result
        });
    }
    catch (error) {
        console.error('Error scraping bucket:', error);
        res.status(500).json({ error: 'Failed to scrape bucket' });
    }
};
exports.scrapeBucket = scrapeBucket;
/**
 * Admin: Scrape multiple buckets (fresher-priority)
 */
const scrapeFresherPriority = async (req, res) => {
    try {
        const userId = req.user?._id || new mongoose_1.default.Types.ObjectId();
        // Check if can make API calls
        const canCall = await scraper.canMakeAPICall();
        if (!canCall.allowed) {
            return res.status(429).json({
                error: canCall.reason,
                usage: canCall
            });
        }
        const fresherBuckets = (0, roleBuckets_1.getFresherPriority)();
        const results = [];
        for (const bucket of fresherBuckets) {
            const result = await scraper.scrapeBucket(bucket.id, userId);
            results.push({
                bucketId: bucket.id,
                bucketName: bucket.name,
                ...result
            });
            // Check after each bucket if we've hit the limit
            const updatedStatus = await scraper.canMakeAPICall();
            if (!updatedStatus.allowed) {
                break;
            }
        }
        const totalJobsCreated = results.reduce((sum, r) => sum + r.totalJobsCreated, 0);
        const totalDuplicates = results.reduce((sum, r) => sum + r.duplicatesFound, 0);
        res.json({
            success: true,
            message: 'Fresher-priority scraping complete',
            bucketsScraped: results.length,
            totalJobsCreated,
            totalDuplicates,
            results
        });
    }
    catch (error) {
        console.error('Error scraping fresher priority:', error);
        res.status(500).json({ error: 'Failed to scrape fresher priority buckets' });
    }
};
exports.scrapeFresherPriority = scrapeFresherPriority;
/**
 * Admin: Scrape all buckets
 */
const scrapeAllBuckets = async (req, res) => {
    try {
        const userId = req.user?._id || new mongoose_1.default.Types.ObjectId();
        // Check if can make API calls
        const canCall = await scraper.canMakeAPICall();
        if (!canCall.allowed) {
            return res.status(429).json({
                error: canCall.reason,
                usage: canCall
            });
        }
        const results = [];
        for (const bucket of roleBuckets_1.ROLE_BUCKETS) {
            const result = await scraper.scrapeBucket(bucket.id, userId);
            results.push({
                bucketId: bucket.id,
                bucketName: bucket.name,
                ...result
            });
            // Check after each bucket
            const updatedStatus = await scraper.canMakeAPICall();
            if (!updatedStatus.allowed) {
                break;
            }
        }
        const totalJobsCreated = results.reduce((sum, r) => sum + r.totalJobsCreated, 0);
        const totalDuplicates = results.reduce((sum, r) => sum + r.duplicatesFound, 0);
        res.json({
            success: true,
            message: 'All buckets scraping complete',
            bucketsScraped: results.length,
            totalJobsCreated,
            totalDuplicates,
            results
        });
    }
    catch (error) {
        console.error('Error scraping all buckets:', error);
        res.status(500).json({ error: 'Failed to scrape all buckets' });
    }
};
exports.scrapeAllBuckets = scrapeAllBuckets;
/**
 * Admin: Get scraping history
 */
const getScrapingHistory = async (req, res) => {
    try {
        const summary = await scraper.getUsageSummary();
        res.json({
            currentMonth: summary.currentMonth,
            apiUsage: {
                totalCalls: summary.totalCalls,
                successfulCalls: summary.successfulCalls,
                failedCalls: summary.failedCalls,
                totalResults: summary.totalResults,
                remaining: summary.remaining,
                warningTriggered: summary.warningTriggered,
                hardStopTriggered: summary.hardStopTriggered,
                hardStopTime: summary.hardStopTime,
                resetAt: summary.resetAt
            },
            recentScrapings: summary.recentLogs.map(log => ({
                keyword: log.keyword,
                roleBucket: log.roleBucket,
                status: log.status,
                resultsCount: log.results_count,
                jobsCreated: log.jobsCreated,
                duplicatesFound: log.duplicatesFound,
                responseTime: log.responseTime,
                executedAt: log.executedAt,
                error: log.error
            }))
        });
    }
    catch (error) {
        console.error('Error fetching scraping history:', error);
        res.status(500).json({ error: 'Failed to fetch scraping history' });
    }
};
exports.getScrapingHistory = getScrapingHistory;

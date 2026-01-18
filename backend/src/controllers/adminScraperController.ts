import { Request, Response } from 'express';
import { JobScraperService } from '../services/jobScraper';
import { ROLE_BUCKETS, getPrimaryBuckets, getFresherPriority } from '../services/roleBuckets';
import mongoose from 'mongoose';

const scraper = new JobScraperService();

/**
 * Admin: Get available role buckets
 */
export const getAvailableBuckets = async (req: Request, res: Response) => {
  try {
    const withStats = req.query.stats === 'true';
    
    let buckets = ROLE_BUCKETS;
    
    if (req.query.priority === 'fresher') {
      buckets = getFresherPriority();
    } else if (req.query.priority === 'primary') {
      buckets = getPrimaryBuckets();
    }

    if (withStats) {
      const bucketStats = buckets.map(b => ({
        ...b,
        keywordCount: b.keywords.length
      }));
      return res.json(bucketStats);
    }

    res.json(buckets);
  } catch (error) {
    console.error('Error fetching buckets:', error);
    res.status(500).json({ error: 'Failed to fetch role buckets' });
  }
};

/**
 * Admin: Get specific bucket details
 */
export const getBucketDetails = async (req: Request, res: Response) => {
  try {
    const { bucketId } = req.params;
    const bucket = ROLE_BUCKETS.find(b => b.id === bucketId);

    if (!bucket) {
      return res.status(404).json({ error: 'Bucket not found' });
    }

    res.json({
      ...bucket,
      keywordCount: bucket.keywords.length
    });
  } catch (error) {
    console.error('Error fetching bucket details:', error);
    res.status(500).json({ error: 'Failed to fetch bucket details' });
  }
};

/**
 * Admin: Check API usage limits
 */
export const checkAPIUsage = async (req: Request, res: Response) => {
  try {
    const canCall = await scraper.canMakeAPICall();
    const summary = await scraper.getUsageSummary();

    res.json({
      canMakeCall: canCall.allowed,
      limitStatus: canCall,
      summary
    });
  } catch (error) {
    console.error('Error checking API usage:', error);
    res.status(500).json({ error: 'Failed to check API usage' });
  }
};

/**
 * Admin: Scrape a specific role bucket
 */
export const scrapeBucket = async (req: Request, res: Response) => {
  try {
    const { bucketId } = req.params;
    const userId = (req as any).user?._id || new mongoose.Types.ObjectId();

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
  } catch (error) {
    console.error('Error scraping bucket:', error);
    res.status(500).json({ error: 'Failed to scrape bucket' });
  }
};

/**
 * Admin: Scrape multiple buckets (fresher-priority)
 */
export const scrapeFresherPriority = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id || new mongoose.Types.ObjectId();

    // Check if can make API calls
    const canCall = await scraper.canMakeAPICall();
    if (!canCall.allowed) {
      return res.status(429).json({
        error: canCall.reason,
        usage: canCall
      });
    }

    const fresherBuckets = getFresherPriority();
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
  } catch (error) {
    console.error('Error scraping fresher priority:', error);
    res.status(500).json({ error: 'Failed to scrape fresher priority buckets' });
  }
};

/**
 * Admin: Scrape all buckets
 */
export const scrapeAllBuckets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id || new mongoose.Types.ObjectId();

    // Check if can make API calls
    const canCall = await scraper.canMakeAPICall();
    if (!canCall.allowed) {
      return res.status(429).json({
        error: canCall.reason,
        usage: canCall
      });
    }

    const results = [];

    for (const bucket of ROLE_BUCKETS) {
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
  } catch (error) {
    console.error('Error scraping all buckets:', error);
    res.status(500).json({ error: 'Failed to scrape all buckets' });
  }
};

/**
 * Admin: Get scraping history
 */
export const getScrapingHistory = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error fetching scraping history:', error);
    res.status(500).json({ error: 'Failed to fetch scraping history' });
  }
};

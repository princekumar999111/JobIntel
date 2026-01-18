import { Request, Response } from 'express';
import { JobSearchService } from '../services/jobSearch';

const searchService = new JobSearchService();

/**
 * User/Public: Search and filter jobs
 */
export const searchJobs = async (req: Request, res: Response) => {
  try {
    const {
      careerLevel,
      domain,
      role,
      techStack,
      employmentType,
      workMode,
      search,
      sortBy = 'recent',
      page = 1,
      limit = 20
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string) || 20, 100),
      sortBy: sortBy as string,
      searchText: search as string
    };

    if (careerLevel) filters.careerLevel = careerLevel;
    if (domain) filters.domain = domain;
    if (role) filters.role = role;
    if (employmentType) filters.employmentType = employmentType;
    if (workMode) filters.workMode = workMode;

    if (techStack) {
      filters.techStack = Array.isArray(techStack)
        ? (techStack as string[])
        : (techStack as string).split(',');
    }

    const result = await searchService.searchJobs(filters);

    res.json({
      success: true,
      data: result.jobs,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search jobs'
    });
  }
};

/**
 * User: Get trending jobs
 */
export const getTrendingJobs = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const jobs = await searchService.getTrendingJobs(limit);

    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error: any) {
    console.error('Error fetching trending jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch trending jobs'
    });
  }
};

/**
 * User: Get fresh jobs (most recent)
 */
export const getFreshJobs = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const jobs = await searchService.getFreshJobs(limit);

    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error: any) {
    console.error('Error fetching fresh jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch fresh jobs'
    });
  }
};

/**
 * User: Get jobs by domain
 */
export const getJobsByDomain = async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await searchService.getJobsByDomain(domain, limit, page);

    res.json({
      success: true,
      data: result.jobs,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error fetching domain jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch domain jobs'
    });
  }
};

/**
 * User: Get fresher jobs
 */
export const getFresherJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await searchService.getFresherJobs(limit, page);

    res.json({
      success: true,
      data: result.jobs,
      pagination: result.pagination,
      note: 'Fresher-focused jobs with 0-1 years experience requirement'
    });
  } catch (error: any) {
    console.error('Error fetching fresher jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch fresher jobs'
    });
  }
};

/**
 * User: Get job by ID
 */
export const getJobById = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch job'
    });
  }
};

/**
 * User: Mark job as applied
 */
export const markJobAsApplied = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    await searchService.incrementAppliedCount(jobId);

    res.json({
      success: true,
      message: 'Job marked as applied'
    });
  } catch (error: any) {
    console.error('Error marking job as applied:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark job as applied'
    });
  }
};

/**
 * User: Get job statistics (public)
 */
export const getJobStats = async (req: Request, res: Response) => {
  try {
    const stats = await searchService.getJobStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch job statistics'
    });
  }
};

/**
 * Admin: Cleanup expired jobs
 */
export const cleanupExpiredJobs = async (req: Request, res: Response) => {
  try {
    const result = await searchService.cleanupExpiredJobs();

    res.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} expired jobs`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Error cleaning up expired jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup expired jobs'
    });
  }
};

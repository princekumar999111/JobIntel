import { ScrapedJob } from '../models/ScrapedJob';
import { Document, FilterQuery } from 'mongoose';

export interface IJobFilter {
  careerLevel?: 'intern' | 'fresher' | 'experienced' | 'lead' | 'manager';
  domain?: 'software' | 'data' | 'ai' | 'cloud' | 'business' | 'mobile' | 'qa' | 'other';
  role?: string;
  techStack?: string[];
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  workMode?: 'remote' | 'hybrid' | 'onsite';
  searchText?: string; // Full text search
  sortBy?: 'recent' | 'relevance' | 'popular'; // recent = fetchedAt, popular = viewCount
  page?: number;
  limit?: number;
}

export class JobSearchService {
  private defaultLimit = 20;
  private defaultPage = 1;

  /**
   * Build MongoDB filter query
   */
  private buildFilterQuery(filters: IJobFilter): FilterQuery<any> {
    const query: FilterQuery<any> = {
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
  async searchJobs(filters: IJobFilter) {
    const page = filters.page || this.defaultPage;
    const limit = Math.min(filters.limit || this.defaultLimit, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build query
    const query = this.buildFilterQuery(filters);

    // Build sort
    const sort: any = {};
    if (filters.sortBy === 'recent') {
      sort.fetchedAt = -1; // Newest first
    } else if (filters.sortBy === 'popular') {
      sort.viewCount = -1;
      sort.appliedCount = -1;
    } else {
      sort.fetchedAt = -1; // Default to recent
    }

    // Execute query
    const [jobs, total] = await Promise.all([
      ScrapedJob.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ScrapedJob.countDocuments(query)
    ]);

    return {
      jobs: jobs as any[],
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
  async getTrendingJobs(limit: number = 10) {
    const jobs = await ScrapedJob.find({
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
  async getFreshJobs(limit: number = 10) {
    const jobs = await ScrapedJob.find({
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
  async getJobsByDomain(domain: string, limit: number = 20, page: number = 1) {
    return this.searchJobs({
      domain: domain as any,
      limit,
      page,
      sortBy: 'recent'
    });
  }

  /**
   * Get fresher-focused jobs
   */
  async getFresherJobs(limit: number = 20, page: number = 1) {
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
  async getMatchingJobs(
    careerLevel?: string,
    domains?: string[],
    roles?: string[],
    techStack?: string[],
    workMode?: string,
    limit: number = 20,
    page: number = 1
  ) {
    const query: FilterQuery<any> = {
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
      ScrapedJob.find(query)
        .sort({ fetchedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ScrapedJob.countDocuments(query)
    ]);

    return {
      jobs: jobs as any[],
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
    const [
      totalJobs,
      fresherJobs,
      batchJobs,
      remoteJobs,
      hybridJobs,
      onsiteJobs,
      fullTimeJobs,
      internshipJobs,
      expiredJobs
    ] = await Promise.all([
      ScrapedJob.countDocuments({ archived: false, expiryDate: { $gt: new Date() } }),
      ScrapedJob.countDocuments({
        archived: false,
        expiryDate: { $gt: new Date() },
        'tags.careerLevel': 'fresher'
      }),
      ScrapedJob.countDocuments({
        archived: false,
        expiryDate: { $gt: new Date() },
        'tags.batchEligibility': { $exists: true, $ne: [] }
      }),
      ScrapedJob.countDocuments({
        archived: false,
        expiryDate: { $gt: new Date() },
        'tags.workMode': 'remote'
      }),
      ScrapedJob.countDocuments({
        archived: false,
        expiryDate: { $gt: new Date() },
        'tags.workMode': 'hybrid'
      }),
      ScrapedJob.countDocuments({
        archived: false,
        expiryDate: { $gt: new Date() },
        'tags.workMode': 'onsite'
      }),
      ScrapedJob.countDocuments({
        archived: false,
        expiryDate: { $gt: new Date() },
        'tags.employmentType': 'full-time'
      }),
      ScrapedJob.countDocuments({
        archived: false,
        expiryDate: { $gt: new Date() },
        'tags.employmentType': 'internship'
      }),
      ScrapedJob.countDocuments({
        archived: false,
        expiryDate: { $lte: new Date() }
      })
    ]);

    // Domain breakdown
    const domainStats = await ScrapedJob.aggregate([
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
      }, {} as Record<string, number>)
    };
  }

  /**
   * Increment view count for a job
   */
  async incrementViewCount(jobId: string) {
    await ScrapedJob.findByIdAndUpdate(
      jobId,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
  }

  /**
   * Increment applied count for a job
   */
  async incrementAppliedCount(jobId: string) {
    await ScrapedJob.findByIdAndUpdate(
      jobId,
      { $inc: { appliedCount: 1 } },
      { new: true }
    );
  }

  /**
   * Archive a job
   */
  async archiveJob(jobId: string) {
    await ScrapedJob.findByIdAndUpdate(
      jobId,
      { archived: true },
      { new: true }
    );
  }

  /**
   * Get a single job by ID
   */
  async getJobById(jobId: string) {
    return ScrapedJob.findById(jobId).lean();
  }

  /**
   * Cleanup expired jobs (run periodically)
   */
  async cleanupExpiredJobs() {
    const result = await ScrapedJob.updateMany(
      {
        expiryDate: { $lte: new Date() },
        archived: false
      },
      {
        archived: true
      }
    );

    return {
      modifiedCount: result.modifiedCount
    };
  }
}

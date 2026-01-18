import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { ScrapedJob, IScrapedJob } from '../models/ScrapedJob';
import { APIUsageLog, APIUsageCounter } from '../models/APIUsageLog';
import { ROLE_BUCKETS, SCRAPING_CONFIG } from './roleBuckets';
import { Request } from 'express';

interface IJobSearchResult {
  job_title?: string;
  employer_name?: string;
  job_location?: string;
  job_description?: string;
  job_apply_link?: string;
  [key: string]: any;
}

interface IOpenWebNinjaResponse {
  status: string;
  data?: IJobSearchResult[];
  error?: string;
  jobs_count?: number;
}

export class JobScraperService {
  private apiKey: string;
  private apiBaseUrl: string = 'https://api.api-ninjas.com/v1/jobs';
  private requestsThisMonth: number = 0;

  constructor() {
    this.apiKey = process.env.OPENWEBNINJA_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENWEBNINJA_API_KEY not set in environment variables');
    }
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonthKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get next month's first day for reset
   */
  private getNextMonthReset(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Check and get current API usage counter
   */
  private async getUsageCounter() {
    const monthKey = this.getCurrentMonthKey();
    
    let counter = await APIUsageCounter.findOne({ month: monthKey });
    
    if (!counter) {
      counter = new APIUsageCounter({
        month: monthKey,
        resetAt: this.getNextMonthReset()
      });
      await counter.save();
    }
    
    return counter;
  }

  /**
   * Check if API calls are allowed (not at hard stop)
   */
  async canMakeAPICall(): Promise<{
    allowed: boolean;
    reason?: string;
    current: number;
    remaining: number;
    limit: number;
  }> {
    const counter = await this.getUsageCounter();
    
    if (counter.hardStopTriggered) {
      return {
        allowed: false,
        reason: `Hard stop reached (${SCRAPING_CONFIG.API_LIMIT_HARD_STOP}/${SCRAPING_CONFIG.API_LIMIT_MONTHLY}). No more API calls allowed this month.`,
        current: counter.totalCalls,
        remaining: 0,
        limit: SCRAPING_CONFIG.API_LIMIT_MONTHLY
      };
    }
    
    if (counter.totalCalls >= SCRAPING_CONFIG.API_LIMIT_HARD_STOP) {
      // Trigger hard stop
      counter.hardStopTriggered = true;
      counter.hardStopTime = new Date();
      await counter.save();
      
      return {
        allowed: false,
        reason: `Hard stop limit reached (${SCRAPING_CONFIG.API_LIMIT_HARD_STOP}/${SCRAPING_CONFIG.API_LIMIT_MONTHLY}). No more API calls allowed.`,
        current: counter.totalCalls,
        remaining: 0,
        limit: SCRAPING_CONFIG.API_LIMIT_MONTHLY
      };
    }
    
    return {
      allowed: true,
      current: counter.totalCalls,
      remaining: SCRAPING_CONFIG.API_LIMIT_HARD_STOP - counter.totalCalls,
      limit: SCRAPING_CONFIG.API_LIMIT_MONTHLY
    };
  }

  /**
   * Increment API usage counter
   */
  private async incrementUsageCounter(
    successCount: number,
    failureCount: number,
    resultsCount: number
  ) {
    const counter = await this.getUsageCounter();
    
    counter.totalCalls += (successCount + failureCount);
    counter.successfulCalls += successCount;
    counter.failedCalls += failureCount;
    counter.totalResults += resultsCount;
    
    // Check warnings
    if (!counter.warningTriggered && counter.totalCalls >= SCRAPING_CONFIG.API_LIMIT_WARNING) {
      counter.warningTriggered = true;
    }
    
    await counter.save();
  }

  /**
   * Generate hash for job deduplication
   */
  private generateJobHash(title: string, company: string, location: string): string {
    const key = `${title}|${company}|${location}`.toLowerCase();
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Search for jobs using OpenWeb Ninja API
   */
  async searchJobs(keyword: string, roleBucket: string, userId: mongoose.Types.ObjectId): Promise<{
    success: boolean;
    jobsCreated: number;
    jobsTotal: number;
    duplicatesFound: number;
    error?: string;
  }> {
    const startTime = Date.now();
    const monthKey = this.getCurrentMonthKey();

    try {
      // Check if API calls allowed
      const canCall = await this.canMakeAPICall();
      if (!canCall.allowed) {
        throw new Error(canCall.reason);
      }

      // Make API call
      const response = await axios.get<IOpenWebNinjaResponse>(this.apiBaseUrl, {
        headers: {
          'X-API-Key': this.apiKey
        },
        params: {
          search: keyword,
          limit: SCRAPING_CONFIG.RESULTS_PER_KEYWORD
        },
        timeout: 10000
      });

      const responseTime = Date.now() - startTime;
      const jobs = response.data?.data || [];
      let jobsCreated = 0;
      let duplicatesFound = 0;

      // Process jobs
      for (const jobData of jobs) {
        try {
          const jobHash = this.generateJobHash(
            jobData.job_title || '',
            jobData.employer_name || '',
            jobData.job_location || ''
          );

          // Check for duplicates
          const existingJob = await ScrapedJob.findOne({ jobHash });
          
          if (existingJob) {
            duplicatesFound++;
            continue;
          }

          // Extract tags from job description
          const description = jobData.job_description || '';
          const tags = this.extractTags(description, keyword, roleBucket);

          // Create new job
          const newJob: Partial<IScrapedJob> = {
            title: jobData.job_title?.trim() || 'Untitled',
            company: jobData.employer_name?.trim() || 'Unknown',
            location: jobData.job_location?.trim() || 'Not specified',
            description,
            applyLink: jobData.job_apply_link || '',
            source: 'openwebninja',
            fetchedAt: new Date(),
            expiryDate: new Date(Date.now() + SCRAPING_CONFIG.JOB_RETENTION_DAYS * 24 * 60 * 60 * 1000),
            jobHash,
            isDuplicate: false,
            tags,
            appliedCount: 0,
            savedCount: 0,
            viewCount: 0
          };

          await ScrapedJob.create(newJob);
          jobsCreated++;
        } catch (jobError) {
          // Log error but continue with next job
          console.error(`Error processing job: ${jobError}`);
        }
      }

      // Log API usage
      await APIUsageLog.create({
        keyword,
        roleBucket,
        results_count: jobs.length,
        status: 'success',
        jobsCreated,
        duplicatesFound,
        duplicatesIgnored: duplicatesFound,
        responseTime,
        executedAt: new Date(),
        executedBy: userId
      });

      // Increment counter
      await this.incrementUsageCounter(1, 0, jobs.length);

      return {
        success: true,
        jobsCreated,
        jobsTotal: jobs.length,
        duplicatesFound
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof AxiosError ? error.message : String(error);

      // Log failed API call
      await APIUsageLog.create({
        keyword,
        roleBucket,
        results_count: 0,
        status: 'failed',
        error: errorMessage,
        jobsCreated: 0,
        duplicatesFound: 0,
        duplicatesIgnored: 0,
        responseTime,
        executedAt: new Date(),
        executedBy: userId
      });

      // Increment counter for failed call
      await this.incrementUsageCounter(0, 1, 0);

      return {
        success: false,
        jobsCreated: 0,
        jobsTotal: 0,
        duplicatesFound: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Extract tags from job description
   */
  private extractTags(description: string, keyword: string, roleBucket: string): any {
    const descLower = description.toLowerCase();
    
    // Default tags
    const tags: any = {
      careerLevel: 'fresher',
      domain: 'software',
      role: this.extractRoleFromKeyword(keyword),
      techStack: this.extractTechStack(description),
      experienceRange: '0-1',
      employmentType: 'full-time',
      workMode: this.extractWorkMode(description),
      batchEligibility: []
    };

    // Detect career level
    if (descLower.includes('5+ years') || descLower.includes('5-7 years')) {
      tags.careerLevel = 'experienced';
      tags.experienceRange = '5+';
    } else if (descLower.includes('2-5 years')) {
      tags.careerLevel = 'experienced';
      tags.experienceRange = '2-5';
    } else if (descLower.includes('lead') || descLower.includes('senior')) {
      tags.careerLevel = 'lead';
    }

    // Detect domain
    if (keyword.includes('data') || keyword.includes('ml') || keyword.includes('ai')) {
      tags.domain = 'data';
    } else if (keyword.includes('devops') || keyword.includes('cloud')) {
      tags.domain = 'cloud';
    } else if (keyword.includes('qa') || keyword.includes('test')) {
      tags.domain = 'qa';
    }

    // Detect employment type
    if (descLower.includes('part-time')) {
      tags.employmentType = 'part-time';
    } else if (descLower.includes('contract')) {
      tags.employmentType = 'contract';
    } else if (descLower.includes('internship') || descLower.includes('intern')) {
      tags.employmentType = 'internship';
    }

    // Detect batch eligibility
    if (descLower.includes('2024') || descLower.includes('batch 24')) {
      tags.batchEligibility.push('2024');
    }
    if (descLower.includes('2025') || descLower.includes('batch 25')) {
      tags.batchEligibility.push('2025');
    }

    return tags;
  }

  /**
   * Extract role from search keyword
   */
  private extractRoleFromKeyword(keyword: string): string {
    const lowerKeyword = keyword.toLowerCase();
    
    if (lowerKeyword.includes('backend')) return 'Backend Developer';
    if (lowerKeyword.includes('frontend') || lowerKeyword.includes('react')) return 'Frontend Developer';
    if (lowerKeyword.includes('fullstack')) return 'Full Stack Developer';
    if (lowerKeyword.includes('data scientist')) return 'Data Scientist';
    if (lowerKeyword.includes('data analyst')) return 'Data Analyst';
    if (lowerKeyword.includes('devops')) return 'DevOps Engineer';
    if (lowerKeyword.includes('cloud')) return 'Cloud Engineer';
    if (lowerKeyword.includes('qa')) return 'QA Engineer';
    if (lowerKeyword.includes('mobile')) return 'Mobile Developer';
    
    return 'Software Engineer';
  }

  /**
   * Extract tech stack from description
   */
  private extractTechStack(description: string): string[] {
    const techKeywords = [
      'python', 'javascript', 'typescript', 'java', 'c#', 'go', 'rust',
      'react', 'vue', 'angular', 'node', 'express', 'django', 'flask',
      'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
      'docker', 'kubernetes', 'aws', 'gcp', 'azure',
      'git', 'jenkins', 'github', 'gitlab', 'ci/cd'
    ];
    
    const descLower = description.toLowerCase();
    return techKeywords.filter(tech => descLower.includes(tech));
  }

  /**
   * Extract work mode from description
   */
  private extractWorkMode(description: string): string {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('work from home') || descLower.includes('remote')) {
      return 'remote';
    }
    if (descLower.includes('hybrid')) {
      return 'hybrid';
    }
    
    return 'onsite';
  }

  /**
   * Scrape a specific role bucket
   */
  async scrapeBucket(bucketId: string, userId: mongoose.Types.ObjectId): Promise<{
    success: boolean;
    bucketsScraped: number;
    totalJobsScraped: number;
    totalJobsCreated: number;
    duplicatesFound: number;
    errors: string[];
  }> {
    const bucket = ROLE_BUCKETS.find(b => b.id === bucketId);
    
    if (!bucket) {
      return {
        success: false,
        bucketsScraped: 0,
        totalJobsScraped: 0,
        totalJobsCreated: 0,
        duplicatesFound: 0,
        errors: [`Bucket ${bucketId} not found`]
      };
    }

    let totalJobsScraped = 0;
    let totalJobsCreated = 0;
    let totalDuplicates = 0;
    const errors: string[] = [];

    // Scrape each keyword in the bucket
    for (const keyword of bucket.keywords) {
      const result = await this.searchJobs(keyword, bucketId, userId);
      
      if (result.success) {
        totalJobsScraped += result.jobsTotal;
        totalJobsCreated += result.jobsCreated;
        totalDuplicates += result.duplicatesFound;
      } else {
        errors.push(`${keyword}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      bucketsScraped: 1,
      totalJobsScraped,
      totalJobsCreated,
      duplicatesFound: totalDuplicates,
      errors
    };
  }

  /**
   * Get API usage summary
   */
  async getUsageSummary() {
    const counter = await this.getUsageCounter();
    const logs = await APIUsageLog.find({
      executedAt: {
        $gte: counter.resetAt // Get logs from this month only
      }
    })
      .sort({ executedAt: -1 })
      .limit(50);

    return {
      currentMonth: counter.month,
      totalCalls: counter.totalCalls,
      successfulCalls: counter.successfulCalls,
      failedCalls: counter.failedCalls,
      totalResults: counter.totalResults,
      remaining: SCRAPING_CONFIG.API_LIMIT_HARD_STOP - counter.totalCalls,
      warningTriggered: counter.warningTriggered,
      hardStopTriggered: counter.hardStopTriggered,
      hardStopTime: counter.hardStopTime,
      resetAt: counter.resetAt,
      recentLogs: logs
    };
  }
}

import mongoose from 'mongoose';

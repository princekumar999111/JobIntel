import { Job } from '../models/Job';
import { ScraperJob } from '../models/ScraperJob';
import { IUser } from '../models/User';

export interface JobMatch {
  jobId: string;
  job: any;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  source: 'admin' | 'scraper';
}

export class JobMatcher {
  /**
   * Calculate match score between user and job
   */
  static async findMatches(user: IUser, limit: number = 10): Promise<JobMatch[]> {
    try {
      // Get admin-posted jobs
      const adminJobs = await Job.find({ status: 'active' }).lean().limit(limit * 2);
      
      // Get scraped jobs (most recent)
      const scrapedJobs = await ScraperJob.find({ 
        status: 'active',
        archived: false 
      })
        .lean()
        .sort({ createdAt: -1 })
        .limit(limit * 2);

      const matches: JobMatch[] = [];

      // Match admin jobs
      for (const job of adminJobs) {
        const match = this.calculateMatch(user, job, 'admin');
        if (match.matchScore > 30) {
          matches.push(match);
        }
      }

      // Match scraped jobs
      for (const job of scrapedJobs) {
        const match = this.calculateMatch(user, job, 'scraper');
        if (match.matchScore > 30) {
          matches.push(match);
        }
      }

      // Sort by score descending and return top results
      return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
    } catch (err) {
      console.error('Error finding matches:', err);
      return [];
    }
  }

  /**
   * Calculate individual match score for user-job pair
   */
  private static calculateMatch(user: IUser, job: any, source: 'admin' | 'scraper' = 'admin'): JobMatch {
    let matchScore = 0;
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const reasons: string[] = [];

    const userSkills = (user.skills || []).map(s => s.toLowerCase());
    const jobSkills = (job.requiredSkills || []).map((s: string) => s.toLowerCase());
    const preferredSkills = (job.preferredSkills || []).map((s: string) => s.toLowerCase());

    // 1. Skills matching (40% weight)
    let skillMatchCount = 0;
    for (const jobSkill of jobSkills) {
      if (userSkills.some(s => s.includes(jobSkill) || jobSkill.includes(s))) {
        matchedSkills.push(jobSkill);
        skillMatchCount++;
      } else {
        missingSkills.push(jobSkill);
      }
    }

    const requiredSkillsScore = jobSkills.length > 0 
      ? (skillMatchCount / jobSkills.length) * 40 
      : 40;
    matchScore += requiredSkillsScore;

    if (skillMatchCount >= jobSkills.length) {
      reasons.push(`✓ Has all ${jobSkills.length} required skills`);
    } else if (skillMatchCount > 0) {
      reasons.push(`✓ Has ${skillMatchCount}/${jobSkills.length} required skills`);
    }

    // 2. Preferred skills (15% weight)
    let preferredMatchCount = 0;
    for (const prefSkill of preferredSkills) {
      if (userSkills.some(s => s.includes(prefSkill) || prefSkill.includes(s))) {
        preferredMatchCount++;
      }
    }
    const preferredScore = preferredSkills.length > 0
      ? (preferredMatchCount / preferredSkills.length) * 15
      : 15;
    matchScore += preferredScore;

    if (preferredMatchCount > 0) {
      reasons.push(`✓ Has ${preferredMatchCount} preferred skills`);
    }

    // 3. Location match (15% weight)
    if (job.location && user.location) {
      const userLoc = user.location.toLowerCase();
      const jobLoc = job.location.toLowerCase();
      if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc) || jobLoc.includes('remote')) {
        matchScore += 15;
        reasons.push(`✓ Location match: ${user.location}`);
      } else if (jobLoc.includes('remote') || jobLoc.includes('work from home')) {
        matchScore += 15;
        reasons.push('✓ Remote job');
      }
    } else if (job.location && job.location.toLowerCase().includes('remote')) {
      matchScore += 15;
      reasons.push('✓ Remote position');
    }

    // 4. Experience level (15% weight)
    const resumeText = (user.resume?.rawText || '').toLowerCase();
    if (job.experienceLevel) {
      if (job.experienceLevel === 'entry' && !resumeText.includes('senior') && !resumeText.includes('lead')) {
        matchScore += 15;
        reasons.push('✓ Entry level match');
      } else if (job.experienceLevel === 'mid' && resumeText.match(/\d+\s*(?:years?|yrs?)/)) {
        const yearsMatch = resumeText.match(/(\d+)\s*(?:years?|yrs?)/);
        const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
        if (years >= 2 && years <= 5) {
          matchScore += 15;
          reasons.push(`✓ Mid-level (${years}+ years experience)`);
        }
      } else if (job.experienceLevel === 'senior' && resumeText.match(/\d+\s*(?:years?|yrs?)/)) {
        const yearsMatch = resumeText.match(/(\d+)\s*(?:years?|yrs?)/);
        const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
        if (years >= 5) {
          matchScore += 15;
          reasons.push(`✓ Senior level (${years}+ years experience)`);
        }
      }
    }

    // 5. Salary expectation (10% weight)
    if (job.salary && user.expectedSalary) {
      const userSalary = typeof user.expectedSalary === 'string' 
        ? parseInt(user.expectedSalary.replace(/\D/g, '')) 
        : user.expectedSalary;
      const jobSalaryMin = typeof job.salary === 'string'
        ? parseInt(job.salary.split('-')[0].replace(/\D/g, ''))
        : job.salary;
      
      if (userSalary <= jobSalaryMin || jobSalaryMin >= userSalary * 0.8) {
        matchScore += 10;
        reasons.push('✓ Salary in range');
      }
    }

    // Ensure score is between 0-100
    matchScore = Math.min(100, Math.max(0, matchScore));

    return {
      jobId: job._id?.toString() || '',
      job: {
        id: job._id?.toString() || '',
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        description: job.description?.substring(0, 200),
        requiredSkills: job.requiredSkills,
        preferredSkills: job.preferredSkills,
        experienceLevel: job.experienceLevel,
      },
      matchScore: Math.round(matchScore),
      matchedSkills,
      missingSkills,
      reasons,
      source,
    };
  }

  /**
   * Get quick stats about potential matches
   */
  static async getMatchStats(user: IUser): Promise<any> {
    try {
      const allJobs = await Job.find({ status: 'active' }).lean();
      
      let highMatches = 0;
      let mediumMatches = 0;
      let lowMatches = 0;

      for (const job of allJobs) {
        const match = this.calculateMatch(user, job);
        if (match.matchScore >= 75) highMatches++;
        else if (match.matchScore >= 50) mediumMatches++;
        else if (match.matchScore >= 30) lowMatches++;
      }

      return {
        totalJobs: allJobs.length,
        highMatches,
        mediumMatches,
        lowMatches,
        totalPotentialMatches: highMatches + mediumMatches + lowMatches,
      };
    } catch (err) {
      console.error('Error getting match stats:', err);
      return null;
    }
  }
}

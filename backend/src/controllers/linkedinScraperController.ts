import { Request, Response } from 'express';
import {
  scraper,
  SearchFilters,
  PRESET_SEARCHES,
  LOCATIONS,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
} from '../services/linkedinScraper';
import { ScraperJob, ScraperSearch, SalaryData } from '../models/ScraperJob';
import { dataExportService } from '../services/dataExportService';

// Get preset searches
export const getPresetSearches = (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      presets: PRESET_SEARCHES,
      count: PRESET_SEARCHES.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preset searches',
    });
  }
};

// Get locations
export const getLocations = (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      locations: LOCATIONS,
      count: LOCATIONS.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations',
    });
  }
};

// Get experience levels
export const getExperienceLevels = (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      levels: EXPERIENCE_LEVELS,
      count: EXPERIENCE_LEVELS.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch experience levels',
    });
  }
};

// Get employment types
export const getEmploymentTypes = (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      types: EMPLOYMENT_TYPES,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employment types',
    });
  }
};

// Run preset search
export const runPresetSearch = async (req: Request, res: Response) => {
  try {
    // Default to 10 pages (100 jobs) to get ALL available jobs, allow override
    const { presetId, pages = 10 } = req.body;

    if (typeof presetId !== 'number' || presetId < 0 || presetId >= PRESET_SEARCHES.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preset ID',
      });
    }

    const preset = PRESET_SEARCHES[presetId];

    // Create search record
    const searchRecord = await ScraperSearch.create({
      userId: (req as any).user?.id,
      searchQuery: `${preset.keyword} in ${preset.location}`,
      filters: {
        keyword: preset.keyword,
        location: preset.location,
      },
      status: 'pending',
    });

    // Execute search
    const result = await scraper.runPresetSearch(presetId, pages);

    if (!result.success) {
      const errorMsg = (result as any).error || 'Failed to search LinkedIn jobs. Please check API credentials.';
      await ScraperSearch.findByIdAndUpdate(searchRecord._id, {
        status: 'failed',
        error: errorMsg,
      });

      // Log the error for debugging
      console.error(`[LinkedIn Scraper] Search failed: ${errorMsg}`, result);

      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }

    // Save jobs to database
    // API response structure: { status: 'OK', data: [...jobs...] }
    // result.data is the complete axios response
    const jobs = (result as any).data?.data || []; // API response has 'data' array
    console.log(`[LinkedIn Scraper] Preset search returned ${jobs.length} jobs from API`);
    const savedJobIds = [];

    for (const job of jobs) {
      try {
        const existingJob = await ScraperJob.findOne({ jobId: job.job_id });

        if (!existingJob) {
          // Get location - priority: job_city -> job_state -> filters.location
          const location = job.job_city || job.job_state || (job.job_country === 'India' ? 'India' : job.job_country);
          
          // Normalize employment type - handle "Full-time and Part-time" -> take first one
          let employmentType = job.job_employment_type || 'Full-time';
          if (typeof employmentType === 'string' && employmentType.includes('and')) {
            employmentType = employmentType.split('and')[0].trim();
          }
          // Ensure it matches valid enum values
          const validTypes = ['Full-time', 'Part-time', 'Contractor', 'Internship'];
          if (!validTypes.includes(employmentType)) {
            employmentType = 'Full-time'; // Default fallback
          }
          
          const newJob = await ScraperJob.create({
            jobId: job.job_id,
            title: job.job_title,
            company: job.employer_name,
            location: location,
            description: job.job_description,
            requirements: job.job_required_skills || [],
            benefits: job.job_highlights?.Qualifications || [],
            experienceLevel: job.job_required_experience?.required_experience_in_years 
              ? `${job.job_required_experience.required_experience_in_years}+ years`
              : 'Not specified',
            employmentType: employmentType,
            remote: job.job_is_remote || false,
            postedDate: new Date(job.job_posted_at_datetime_utc || job.job_posted_at_datetime || new Date()), // Use UTC field from API
            applyUrl: job.job_apply_link, // Correct field name
            salary: {
              min: job.job_min_salary || 0,
              max: job.job_max_salary || 0,
              currency: job.job_salary_currency || 'USD', // Will be converted if USD
            },
            rawData: job,
          });

          savedJobIds.push(newJob._id);
        } else {
          savedJobIds.push(existingJob._id);
        }
      } catch (jobError) {
        console.error(`Failed to save job ${job.job_id}:`, jobError);
      }
    }

    // Update search record
    await ScraperSearch.findByIdAndUpdate(searchRecord._id, {
      status: 'completed',
      results: savedJobIds,
      resultsCount: savedJobIds.length,
      executedAt: new Date(),
    });

    // Transform jobs to match frontend expectations
    const transformedJobs = jobs.slice(0, 20).map((job: any) => ({
      job_id: job.job_id,
      job_title: job.job_title,
      employer_name: job.employer_name,
      job_location: job.job_location || `${job.job_city}, ${job.job_state}, ${job.job_country}`,
      job_city: job.job_city,
      job_country: job.job_country,
      job_apply_link: job.job_apply_link, // Transform to camelCase for frontend
      applyUrl: job.job_apply_link, // Also add camelCase version
      job_employment_type: job.job_employment_type,
      job_posted_at: job.job_posted_at,
      job_description: job.job_description,
      job_is_remote: job.job_is_remote,
      job_min_salary: job.job_min_salary,
      job_max_salary: job.job_max_salary,
      job_salary_currency: job.job_salary_currency,
    }));

    res.json({
      success: true,
      searchId: searchRecord._id,
      preset: preset,
      jobsFound: savedJobIds.length,
      jobs: transformedJobs,
      message: `Found ${savedJobIds.length} jobs matching "${preset.title}"`,
    });
  } catch (error) {
    console.error('[LinkedIn Scraper] Preset search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run preset search',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Advanced search
export const advancedSearch = async (req: Request, res: Response) => {
  try {
    const filters: SearchFilters = {
      keyword: req.body.keyword,
      location: req.body.location || 'India',
      employmentType: req.body.employmentType,
      datePosted: req.body.datePosted,
      remote: req.body.remote || false,
      experienceLevel: req.body.experienceLevel,
      salaryMin: req.body.salaryMin,
      salaryMax: req.body.salaryMax,
      pages: Math.min(req.body.pages || 1, 10),
    };

    if (!filters.keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword is required',
      });
    }

    // Create search record
    const searchRecord = await ScraperSearch.create({
      userId: (req as any).user?.id,
      searchQuery: filters.keyword,
      filters,
      status: 'pending',
    });

    // Execute search
    const result = await scraper.advancedSearch(filters);

    if (!result.success) {
      const errorMsg = (result as any).error || 'Failed to search LinkedIn jobs';
      await ScraperSearch.findByIdAndUpdate(searchRecord._id, {
        status: 'failed',
        error: errorMsg,
      });

      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }

    // Save jobs
    const jobs = (result as any).data?.data || []; // API returns { data: [...jobs...] }
    const savedJobIds = [];

    for (const job of jobs) {
      try {
        const existingJob = await ScraperJob.findOne({ jobId: job.job_id });

        if (!existingJob) {
          // Normalize employment type
          let employmentType = job.job_employment_type || 'Full-time';
          if (typeof employmentType === 'string' && employmentType.includes('and')) {
            employmentType = employmentType.split('and')[0].trim();
          }
          const validTypes = ['Full-time', 'Part-time', 'Contractor', 'Internship'];
          if (!validTypes.includes(employmentType)) {
            employmentType = 'Full-time';
          }
          
          const newJob = await ScraperJob.create({
            jobId: job.job_id,
            title: job.job_title,
            company: job.employer_name,
            location: job.job_location || job.job_city || job.job_state,
            description: job.job_description,
            requirements: job.job_required_skills || [],
            benefits: job.job_highlights?.Qualifications || job.job_benefits || [],
            experienceLevel: 'Not specified',
            employmentType: employmentType,
            remote: job.job_is_remote || false,
            postedDate: new Date(job.job_posted_at_datetime_utc || job.job_posted_at_datetime || new Date()),
            applyUrl: job.job_apply_link,
            salary: job.job_min_salary || job.job_max_salary
              ? {
                  min: job.job_min_salary || 0,
                  max: job.job_max_salary || 0,
                  currency: 'USD',
                }
              : undefined,
            rawData: job,
          });

          savedJobIds.push(newJob._id);
        } else {
          savedJobIds.push(existingJob._id);
        }
      } catch (jobError) {
        console.error(`Failed to save job ${job.job_id}:`, jobError);
      }
    }

    // Update search record
    await ScraperSearch.findByIdAndUpdate(searchRecord._id, {
      status: 'completed',
      results: savedJobIds,
      resultsCount: savedJobIds.length,
      executedAt: new Date(),
    });

    // Transform jobs to match frontend expectations
    const transformedJobs = jobs.slice(0, 20).map((job: any) => ({
      job_id: job.job_id,
      job_title: job.job_title,
      employer_name: job.employer_name,
      job_location: job.job_location || `${job.job_city}, ${job.job_state}, ${job.job_country}`,
      job_city: job.job_city,
      job_country: job.job_country,
      job_apply_link: job.job_apply_link,
      applyUrl: job.job_apply_link,
      job_employment_type: job.job_employment_type,
      job_posted_at: job.job_posted_at,
      job_description: job.job_description,
      job_is_remote: job.job_is_remote,
      job_min_salary: job.job_min_salary,
      job_max_salary: job.job_max_salary,
      job_salary_currency: job.job_salary_currency,
    }));

    res.json({
      success: true,
      searchId: searchRecord._id,
      jobsFound: savedJobIds.length,
      filters,
      jobs: transformedJobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to perform advanced search',
    });
  }
};

// Get salary data
export const getSalaryInsights = async (req: Request, res: Response) => {
  try {
    const { position, location, experienceLevel } = req.query;

    if (!position || !location) {
      return res.status(400).json({
        success: false,
        error: 'Position and location are required',
      });
    }

    // Check cache first
    const cachedData = await SalaryData.findOne({
      position: position as string,
      location: location as string,
      experienceLevel: experienceLevel as string,
    });

    if (cachedData && new Date().getTime() - cachedData.lastUpdated.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    // Fetch from API
    const result = await scraper.getSalaryData(
      position as string,
      location as string,
      experienceLevel as string
    );

    if (!result.success) {
      const errorMsg = (result as any).error || 'Failed to fetch salary data';
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }

    // Save to database
    const salaryData = await SalaryData.findOneAndUpdate(
      {
        position: position as string,
        location: location as string,
        experienceLevel: experienceLevel as string,
      },
      {
        position: position as string,
        location: location as string,
        experienceLevel: experienceLevel as string,
        salaryRange: {
          min: (result as any).data?.salary_min || 0,
          max: (result as any).data?.salary_max || 0,
          median: (result as any).data?.salary_median || 0,
          currency: 'INR',
        },
        currency: 'INR',
        dataSource: 'OpenWeb Ninja JSearch',
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: salaryData,
      cached: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch salary insights',
    });
  }
};

// Get search history
export const getSearchHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;

    const searches = await ScraperSearch.find(userId ? { userId } : {})
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await ScraperSearch.countDocuments(userId ? { userId } : {});

    res.json({
      success: true,
      searches,
      pagination: {
        total,
        limit,
        skip,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search history',
    });
  }
};

// Get jobs by search ID
export const getSearchResults = async (req: Request, res: Response) => {
  try {
    const { searchId } = req.params;

    const search = await ScraperSearch.findById(searchId).populate('results');

    if (!search) {
      return res.status(404).json({
        success: false,
        error: 'Search not found',
      });
    }

    res.json({
      success: true,
      search,
      jobs: search.results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search results',
    });
  }
};

// Get trending jobs
export const getTrendingJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await ScraperJob.find()
      .sort({ postedDate: -1, _id: -1 })
      .limit(20);

    res.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending jobs',
    });
  }
};

// Search jobs by company
export const searchByCompany = async (req: Request, res: Response) => {
  try {
    const { company, location = 'India' } = req.body;

    if (!company) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required',
      });
    }

    const result = await scraper.searchByCompany(company, location as string);

    if (!result.success) {
      const errorMsg = (result as any).error || 'Failed to search by company';
      return res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }

    res.json({
      success: true,
      company,
      location,
      jobsFound: (result as any).data?.jobs?.length || 0,
      jobs: (result as any).data?.jobs?.slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search by company',
    });
  }
};

// Export jobs to CSV
export const exportJobsToCSV = async (req: Request, res: Response) => {
  try {
    const { searchId } = req.params;
    const { format = 'csv' } = req.query;

    const search = await ScraperSearch.findById(searchId).populate('results');

    if (!search) {
      return res.status(404).json({
        success: false,
        error: 'Search not found',
      });
    }

    const jobs = search.results as any[];

    if (format === 'json') {
      const result = await dataExportService.exportToJSON(jobs, `search_${searchId}.json`, {
        searchQuery: search.searchQuery,
        filters: search.filters,
        jobCount: jobs.length,
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      // Return file for download
      return res.json({
        success: true,
        fileName: result.fileName,
        message: `${jobs.length} jobs exported to JSON`,
      });
    } else {
      const result = await dataExportService.exportToCSV(jobs, `search_${searchId}.csv`);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      // Return file for download
      return res.json({
        success: true,
        fileName: result.fileName,
        message: `${jobs.length} jobs exported to CSV`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export jobs',
    });
  }
};

// Bulk export multiple searches
export const bulkExportSearches = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { format = 'csv' } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const searches = await ScraperSearch.find({ userId }).populate('results');

    if (searches.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No searches found',
      });
    }

    // Combine all jobs from all searches
    const allJobs = searches.flatMap((search) => search.results);

    if (format === 'json') {
      const result = await dataExportService.exportToJSON(
        allJobs,
        `all_searches_${new Date().toISOString().split('T')[0]}.json`,
        {
          totalSearches: searches.length,
          totalJobs: allJobs.length,
        }
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.json({
        success: true,
        fileName: result.fileName,
        message: `${allJobs.length} jobs from ${searches.length} searches exported`,
      });
    } else {
      const result = await dataExportService.exportToCSV(
        allJobs,
        `all_searches_${new Date().toISOString().split('T')[0]}.csv`
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.json({
        success: true,
        fileName: result.fileName,
        message: `${allJobs.length} jobs from ${searches.length} searches exported`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export searches',
    });
  }
};

// Export salary data
export const exportSalaryData = async (req: Request, res: Response) => {
  try {
    const { format = 'csv' } = req.body;

    const salaryData = await SalaryData.find().limit(100);

    if (salaryData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No salary data available',
      });
    }

    if (format === 'json') {
      const report = dataExportService.generateSalaryComparison(salaryData);

      const result = await dataExportService.exportToJSON(
        salaryData,
        `salary_data_${new Date().toISOString().split('T')[0]}.json`,
        report
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.json({
        success: true,
        fileName: result.fileName,
        message: `${salaryData.length} salary records exported`,
      });
    } else {
      const result = await dataExportService.exportSalaryData(
        salaryData,
        `salary_data_${new Date().toISOString().split('T')[0]}.csv`
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.json({
        success: true,
        fileName: result.fileName,
        message: `${salaryData.length} salary records exported`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export salary data',
    });
  }
};

// Get salary comparison report
export const getSalaryReport = async (req: Request, res: Response) => {
  try {
    const salaryData = await SalaryData.find().limit(100);

    const report = dataExportService.generateSalaryComparison(salaryData);

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate salary report',
    });
  }
};

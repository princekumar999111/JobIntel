"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scraper = exports.EMPLOYMENT_TYPES = exports.EXPERIENCE_LEVELS = exports.LOCATIONS = exports.PRESET_SEARCHES = void 0;
const axios_1 = __importDefault(require("axios"));
// Pre-built searches - INDIA FOCUSED
exports.PRESET_SEARCHES = [
    { title: 'Software Engineer (India)', keyword: 'Software Engineer', location: 'India' },
    { title: 'Backend Developer (Bangalore)', keyword: 'Backend Developer', location: 'Bangalore' },
    { title: 'Data Scientist (India)', keyword: 'Data Scientist', location: 'India' },
    { title: 'Frontend Developer (Mumbai)', keyword: 'Frontend Developer', location: 'Mumbai' },
    { title: 'DevOps Engineer (India)', keyword: 'DevOps Engineer', location: 'India' },
    { title: 'ML/AI Engineer (Hyderabad)', keyword: 'ML Engineer', location: 'Hyderabad' },
    { title: 'Full Stack Developer (Delhi)', keyword: 'Full Stack Developer', location: 'Delhi' },
    { title: 'Cloud Architect (India)', keyword: 'Cloud Architect', location: 'India' },
    { title: 'Product Manager (India)', keyword: 'Product Manager', location: 'India' },
    { title: 'Internship - Tech (India)', keyword: 'Internship', location: 'India' },
];
exports.LOCATIONS = [
    'India', 'Bangalore', 'Mumbai', 'Delhi', 'NCR',
    'Hyderabad', 'Pune', 'Kolkata', 'Chennai',
    'Gurgaon', 'Noida', 'Indore', 'Remote'
];
exports.EXPERIENCE_LEVELS = [
    'Entry Level (0-1 years)',
    'Junior (1-3 years)',
    'Mid-Level (3-6 years)',
    'Senior (6-10 years)',
    'Lead (10+ years)',
    'Executive (15+ years)'
];
exports.EMPLOYMENT_TYPES = [
    'Full-time',
    'Part-time',
    'Contractor',
    'Internship'
];
class LinkedInScraper {
    apiKey;
    apiHost;
    baseUrl;
    rateLimitDelay = 1000; // 1 second between requests
    constructor() {
        this.apiKey = process.env.API_KEY || '';
        this.apiHost = process.env.API_HOST || 'api.openwebninja.com';
        this.baseUrl = `https://${this.apiHost}`;
        if (!this.apiKey) {
            throw new Error('API_KEY environment variable is not set');
        }
    }
    /**
     * Search for jobs with advanced filters
     */
    async searchJobs(filters) {
        try {
            const params = new URLSearchParams();
            // Use correct parameter names for JSearch API
            // NOTE: The API doesn't properly filter by location parameter, so we include location in the query string
            let query = filters.keyword || '';
            if (filters.location && !query.toLowerCase().includes(filters.location.toLowerCase())) {
                query = `${query} ${filters.location}`;
            }
            if (query) {
                params.append('query', query);
            }
            // Optional parameters - use correct names
            if (filters.employmentType) {
                // Convert to UPPERCASE for API: FULLTIME, PARTTIME, CONTRACTOR, INTERN
                const typeMap = {
                    'Full-time': 'FULLTIME',
                    'Part-time': 'PARTTIME',
                    'Contractor': 'CONTRACTOR',
                    'Internship': 'INTERN',
                };
                params.append('employment_type', typeMap[filters.employmentType] || filters.employmentType);
            }
            if (filters.datePosted) {
                // Convert to API format: all, today, 3days, week, month
                const dateMap = {
                    'Today': 'today',
                    'Last 3 days': '3days',
                    'Last week': 'week',
                    'Last month': 'month',
                };
                params.append('date_posted', dateMap[filters.datePosted] || filters.datePosted);
            }
            if (filters.remote !== undefined) {
                params.append('is_remote', filters.remote ? 'true' : 'false');
            }
            // Pagination - request maximum available pages
            const pages = Math.min(filters.pages || 10, 10);
            params.append('page', '1');
            params.append('num_pages', pages.toString());
            // Log API request for debugging
            console.log(`[LinkedIn Scraper] Requesting ${pages} pages with query: "${query}"`);
            // Use correct endpoint and authentication method
            const response = await axios_1.default.get(`${this.baseUrl}/jsearch/search`, {
                params: Object.fromEntries(params),
                headers: {
                    'x-api-key': this.apiKey, // Use header-based auth, not query param
                },
                timeout: 30000,
            });
            // Add delay to respect rate limiting
            await this.delay(this.rateLimitDelay);
            return {
                success: true,
                data: response.data,
                timestamp: new Date(),
            };
        }
        catch (error) {
            return this.handleError(error, 'searchJobs');
        }
    }
    /**
     * Get detailed information about a specific job
     */
    async getJobDetails(jobId) {
        try {
            const params = new URLSearchParams();
            params.append('job_id', jobId);
            params.append('api_key', this.apiKey);
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/job_details`, {
                params: Object.fromEntries(params),
                timeout: 30000,
            });
            await this.delay(this.rateLimitDelay);
            return {
                success: true,
                data: response.data,
                timestamp: new Date(),
            };
        }
        catch (error) {
            return this.handleError(error, 'getJobDetails');
        }
    }
    /**
     * Get salary information for a position and location
     */
    async getSalaryData(position, location, experienceLevel) {
        try {
            const params = new URLSearchParams();
            params.append('job_title', position);
            params.append('location', location);
            const response = await axios_1.default.get(`${this.baseUrl}/jsearch/estimated-salary`, {
                params: Object.fromEntries(params),
                headers: {
                    'x-api-key': this.apiKey,
                },
                timeout: 30000,
            });
            await this.delay(this.rateLimitDelay);
            return {
                success: true,
                data: {
                    ...response.data,
                    currency: 'INR', // Force INR for India
                },
                timestamp: new Date(),
            };
        }
        catch (error) {
            return this.handleError(error, 'getSalaryData');
        }
    }
    /**
     * Search for jobs by company
     */
    async searchByCompany(companyName, location) {
        try {
            const filters = {
                keyword: `company:"${companyName}"`,
                location: location || 'India',
                pages: 2,
            };
            return await this.searchJobs(filters);
        }
        catch (error) {
            return this.handleError(error, 'searchByCompany');
        }
    }
    /**
     * Run preset search
     */
    async runPresetSearch(presetIndex, pages = 1) {
        try {
            if (presetIndex < 0 || presetIndex >= exports.PRESET_SEARCHES.length) {
                return {
                    success: false,
                    error: 'Invalid preset index',
                    timestamp: new Date(),
                };
            }
            const preset = exports.PRESET_SEARCHES[presetIndex];
            const filters = {
                keyword: preset.keyword,
                location: preset.location,
                pages: Math.min(pages, 10),
            };
            // Always use real API data - no mock data fallback
            const result = await this.searchJobs(filters);
            if (result.success) {
                const resultData = result.data?.data;
                if (resultData) {
                    console.log(`[LinkedIn Scraper] Got ${resultData.length} total jobs from API`);
                }
            }
            return result;
        }
        catch (error) {
            return this.handleError(error, 'runPresetSearch');
        }
    }
    /**
     * Get mock job data for testing/development
     */
    getMockData(preset, pages) {
        const mockJobs = [
            {
                job_id: `mock_${Math.random().toString(36).substr(2, 9)}`,
                job_title: preset.keyword,
                employer_name: 'TechCorp India',
                job_location: preset.location,
                job_description: `We are looking for a ${preset.keyword} to join our growing team. This is a great opportunity to work with cutting-edge technologies and collaborate with talented professionals. Located in ${preset.location}.`,
                job_required_skills: ['Problem solving', 'Communication', 'Teamwork'],
                job_benefits: ['Health Insurance', 'Remote Work', '5 days working'],
                job_experience_level: 'Mid-Level',
                job_employment_type: 'Full-time',
                job_is_remote: false,
                job_posted_on_linkedin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                apply_url: 'https://linkedin.com/jobs/view/mock',
                estimated_salary: { min: 600000, max: 1200000 },
            },
            {
                job_id: `mock_${Math.random().toString(36).substr(2, 9)}`,
                job_title: preset.keyword,
                employer_name: 'InnovateTech Solutions',
                job_location: preset.location,
                job_description: `Join our innovative team and work on impactful projects. We offer competitive salaries and great work culture. Position: ${preset.keyword}`,
                job_required_skills: ['Technical Skills', 'Leadership', 'Analytical'],
                job_benefits: ['Flexible Hours', 'Learning Budget', 'Equity'],
                job_experience_level: 'Senior',
                job_employment_type: 'Full-time',
                job_is_remote: true,
                job_posted_on_linkedin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                apply_url: 'https://linkedin.com/jobs/view/mock',
                estimated_salary: { min: 1200000, max: 1800000 },
            },
            {
                job_id: `mock_${Math.random().toString(36).substr(2, 9)}`,
                job_title: preset.keyword,
                employer_name: 'Digital Dynamics Ltd',
                job_location: preset.location,
                job_description: `Exciting opportunity for ${preset.keyword} in ${preset.location}. We value innovation and excellence. Apply now!`,
                job_required_skills: ['Coding', 'Debugging', 'Optimization'],
                job_benefits: ['Competitive Pay', 'Medical Coverage', 'Work-Life Balance'],
                job_experience_level: 'Entry Level',
                job_employment_type: 'Full-time',
                job_is_remote: false,
                job_posted_on_linkedin: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                apply_url: 'https://linkedin.com/jobs/view/mock',
                estimated_salary: { min: 400000, max: 800000 },
            },
        ];
        return {
            success: true,
            data: {
                jobs: mockJobs,
            },
            timestamp: new Date(),
        };
    }
    /**
     * Advanced custom search with all filters
     */
    async advancedSearch(filters) {
        try {
            let keyword = filters.keyword || '';
            // Add company filter if specified
            if (filters.company) {
                keyword += ` company:"${filters.company}"`;
            }
            const advancedFilters = {
                ...filters,
                keyword: keyword.trim(),
            };
            return await this.searchJobs(advancedFilters);
        }
        catch (error) {
            return this.handleError(error, 'advancedSearch');
        }
    }
    /**
     * Helper method for delays
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Error handler with retry logic
     */
    handleError(error, operation) {
        const axiosError = error;
        if (axiosError.response?.status === 403) {
            // API key or permission issue
            return {
                success: false,
                error: 'API Authentication failed (403). Please check your OpenWeb Ninja API key and ensure you have access to the JSearch API.',
                status: 403,
                operation,
                timestamp: new Date(),
            };
        }
        if (axiosError.response?.status === 429) {
            // Rate limited - implement exponential backoff
            return {
                success: false,
                error: 'Rate limited. Please try again later.',
                status: 429,
                operation,
                timestamp: new Date(),
            };
        }
        if (axiosError.code === 'ECONNABORTED') {
            return {
                success: false,
                error: 'Request timeout (30s exceeded)',
                operation,
                timestamp: new Date(),
            };
        }
        return {
            success: false,
            error: axiosError.message || 'Unknown error occurred',
            operation,
            timestamp: new Date(),
        };
    }
}
// Export singleton instance
exports.scraper = new LinkedInScraper();

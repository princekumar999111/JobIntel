"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)('jobintel:openwebninja');
class OpenWebNinjaService {
    client;
    apiKey;
    apiHost;
    baseUrl;
    requestDelay = 1000; // 1 second between requests
    lastRequestTime = 0;
    maxRetries = 3;
    timeout = 30000; // 30 seconds
    constructor() {
        this.apiKey = process.env.API_KEY || '';
        this.apiHost = process.env.API_HOST || 'api.openwebninja.com';
        this.baseUrl = `https://${this.apiHost}`;
        if (!this.apiKey) {
            log('⚠️ API_KEY not configured in environment variables');
        }
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'User-Agent': 'JobIntel-Bot/3.0',
                'Accept': 'application/json',
            },
        });
    }
    /**
     * Rate limiting: Wait between requests
     */
    async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.requestDelay) {
            await new Promise((resolve) => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }
    /**
     * Retry logic with exponential backoff
     */
    async retryRequest(fn, operationName) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                await this.rateLimit();
                log(`📡 ${operationName} - Attempt ${attempt}/${this.maxRetries}`);
                return await fn();
            }
            catch (error) {
                lastError = error;
                log(`❌ ${operationName} failed (Attempt ${attempt}): ${error.message}`);
                if (attempt < this.maxRetries) {
                    const backoffMs = Math.pow(2, attempt) * 1000;
                    log(`⏳ Retrying in ${backoffMs}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, backoffMs));
                }
            }
        }
        throw lastError;
    }
    /**
     * Search LinkedIn jobs
     * @param params Search parameters
     * @returns Job search results
     */
    async searchJobs(params) {
        if (!this.apiKey) {
            throw new Error('API_KEY not configured');
        }
        const validationError = this.validateJobSearchParams(params);
        if (validationError) {
            throw new Error(validationError);
        }
        return await this.retryRequest(async () => {
            const response = await this.client.get('/api/v1/jobs', {
                params: {
                    api_key: this.apiKey,
                    search_term: params.query,
                    country: params.country,
                    page: params.page || 1,
                    num_pages: params.num_pages || 1,
                    employment_type: params.employment_type,
                    date_posted: params.date_posted,
                    remote_jobs_only: params.remote_jobs_only ? 'true' : 'false',
                },
            });
            log(`✅ Job search successful: Found ${response.data?.data?.length || 0} jobs`);
            return response.data;
        }, `Search: ${params.query} in ${params.country}`);
    }
    /**
     * Get detailed job information
     * @param jobId Job ID
     * @returns Detailed job information
     */
    async getJobDetails(jobId) {
        if (!this.apiKey) {
            throw new Error('API_KEY not configured');
        }
        if (!jobId || jobId.trim().length === 0) {
            throw new Error('Job ID is required');
        }
        return await this.retryRequest(async () => {
            const response = await this.client.get('/api/v1/job', {
                params: {
                    api_key: this.apiKey,
                    job_id: jobId,
                },
            });
            log(`✅ Job details retrieved: ${response.data?.data?.job_title}`);
            return response.data;
        }, `Get Job Details: ${jobId}`);
    }
    /**
     * Query salary information
     * @param params Salary query parameters
     * @returns Salary data
     */
    async querySalary(params) {
        if (!this.apiKey) {
            throw new Error('API_KEY not configured');
        }
        const validationError = this.validateSalaryParams(params);
        if (validationError) {
            throw new Error(validationError);
        }
        return await this.retryRequest(async () => {
            const response = await this.client.get('/api/v1/salary', {
                params: {
                    api_key: this.apiKey,
                    job_title: params.job_title,
                    location: params.location,
                    experience_level: params.experience_level,
                    company: params.company,
                },
            });
            log(`✅ Salary data retrieved: ${params.job_title} in ${params.location}`);
            return response.data;
        }, `Salary Query: ${params.job_title}`);
    }
    /**
     * Validate job search parameters
     */
    validateJobSearchParams(params) {
        if (!params.query || params.query.trim().length === 0) {
            return 'Query (job title) is required';
        }
        if (!params.country || params.country.trim().length === 0) {
            return 'Country is required';
        }
        if (params.page && params.page < 1) {
            return 'Page must be >= 1';
        }
        if (params.num_pages && (params.num_pages < 1 || params.num_pages > 10)) {
            return 'Number of pages must be between 1 and 10';
        }
        return null;
    }
    /**
     * Validate salary query parameters
     */
    validateSalaryParams(params) {
        if (!params.job_title || params.job_title.trim().length === 0) {
            return 'Job title is required';
        }
        if (!params.location || params.location.trim().length === 0) {
            return 'Location is required';
        }
        return null;
    }
    /**
     * Get pre-built searches for common job positions
     */
    static getPreBuiltSearches() {
        return [
            { id: 1, query: 'Project Manager', country: 'Spain' },
            { id: 2, query: 'Software Engineer', country: 'Spain' },
            { id: 3, query: 'Backend Developer', country: 'USA' },
            { id: 4, query: 'Machine Learning Engineer', country: 'USA' },
            { id: 5, query: 'DevOps Engineer', country: 'UK' },
            { id: 6, query: 'Frontend Developer', country: 'Germany' },
            { id: 7, query: 'Full Stack Developer', country: 'France' },
            { id: 8, query: 'Data Scientist', country: 'Netherlands' },
            { id: 9, query: 'Product Manager', country: 'Canada' },
            { id: 10, query: 'UX Designer', country: 'Australia' },
        ];
    }
    /**
     * Get supported countries
     */
    static getSupportedCountries() {
        return [
            'Spain',
            'USA',
            'UK',
            'Germany',
            'France',
            'Netherlands',
            'Canada',
            'Australia',
            'Mexico',
            'Argentina',
            'Colombia',
            'Chile',
        ];
    }
    /**
     * Get supported employment types
     */
    static getEmploymentTypes() {
        return [
            'Full-time',
            'Part-time',
            'Contractor',
            'Internship',
        ];
    }
    /**
     * Get date filter options
     */
    static getDateFilters() {
        return [
            { value: 'today', label: 'Today' },
            { value: 'last_3_days', label: 'Last 3 Days' },
            { value: 'last_week', label: 'Last Week' },
            { value: 'last_month', label: 'Last Month' },
            { value: 'any_time', label: 'Any Time' },
        ];
    }
    /**
     * Get experience level options
     */
    static getExperienceLevels() {
        return [
            { value: 'less_than_1_year', label: 'Less than 1 year' },
            { value: '1_to_3_years', label: '1-3 years' },
            { value: '4_to_6_years', label: '4-6 years' },
            { value: '7_to_9_years', label: '7-9 years' },
            { value: '10_plus_years', label: '10+ years' },
        ];
    }
}
exports.default = new OpenWebNinjaService();

"use strict";
/**
 * Role Bucket System - 11 Categories with 68 Predefined Keywords
 * For Fresher-First Job Aggregation + Matching Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKET_KEYWORDS_SUMMARY = exports.SCRAPING_CONFIG = exports.getPrimaryBuckets = exports.getSearchKeywordsCombined = exports.getBucketsByDomain = exports.getFresherPriority = exports.getBucketsByPriority = exports.getBucketById = exports.ROLE_BUCKETS = void 0;
exports.ROLE_BUCKETS = [
    // ================================================
    // BUCKET 1: Fresher/Intern/Trainee (12 keywords)
    // Priority: HIGHEST (0-1 year experience)
    // ================================================
    {
        id: 'fresher-entry-level',
        name: 'Fresher Entry Level',
        description: 'Roles for recent graduates and first-time job seekers with 0-1 years experience',
        keywords: [
            'fresher',
            'entry level',
            'graduate engineer',
            'junior developer',
            'trainee',
            'intern',
            'graduate program',
            'campus recruit',
            'new graduate',
            'first job',
            '0-1 year',
            'no experience required'
        ],
        careerLevel: ['fresher', 'intern'],
        domain: ['software', 'data', 'ai', 'cloud', 'business', 'mobile', 'qa'],
        priority: 1,
        recommendedFrequency: 'daily',
        searchStrategy: 'combined'
    },
    // ================================================
    // BUCKET 2: Batch-based Hiring (4 keywords)
    // Priority: VERY HIGH (Batch 2024, 2025, 2026)
    // ================================================
    {
        id: 'batch-hiring',
        name: 'Batch-based Hiring',
        description: 'Campus recruitment and batch-based hiring for students/freshers',
        keywords: [
            'batch hiring',
            'campus recruitment',
            'batch 2024',
            'batch 2025'
        ],
        careerLevel: ['fresher', 'intern'],
        domain: ['software', 'data', 'ai', 'cloud'],
        priority: 2,
        recommendedFrequency: 'twice-weekly',
        searchStrategy: 'exact'
    },
    // ================================================
    // BUCKET 3: Software Engineering (9 keywords)
    // Priority: HIGH (Largest demand)
    // ================================================
    {
        id: 'software-engineering',
        name: 'Software Engineering',
        description: 'Backend, frontend, fullstack software development roles',
        keywords: [
            'software engineer',
            'backend developer',
            'frontend developer',
            'fullstack developer',
            'web developer',
            'nodejs developer',
            'react developer',
            'python developer',
            'java developer'
        ],
        careerLevel: ['fresher', 'experienced'],
        domain: ['software'],
        priority: 3,
        recommendedFrequency: 'daily',
        searchStrategy: 'combined'
    },
    // ================================================
    // BUCKET 4: Data/AI/ML (8 keywords)
    // Priority: HIGH (Growing demand)
    // ================================================
    {
        id: 'data-ai-ml',
        name: 'Data Science & AI/ML',
        description: 'Data analyst, data scientist, ML engineer, AI roles',
        keywords: [
            'data scientist',
            'data analyst',
            'machine learning engineer',
            'ai engineer',
            'ml engineer',
            'deep learning',
            'data engineering',
            'nlp engineer'
        ],
        careerLevel: ['fresher', 'experienced'],
        domain: ['data', 'ai'],
        priority: 4,
        recommendedFrequency: 'daily',
        searchStrategy: 'combined'
    },
    // ================================================
    // BUCKET 5: Cloud & DevOps (7 keywords)
    // Priority: MEDIUM-HIGH (Infrastructure focus)
    // ================================================
    {
        id: 'cloud-devops',
        name: 'Cloud & DevOps',
        description: 'AWS, Azure, GCP, Kubernetes, infrastructure automation roles',
        keywords: [
            'devops engineer',
            'cloud engineer',
            'aws engineer',
            'kubernetes engineer',
            'infrastructure engineer',
            'site reliability engineer',
            'gcp engineer'
        ],
        careerLevel: ['fresher', 'experienced'],
        domain: ['cloud'],
        priority: 5,
        recommendedFrequency: 'twice-weekly',
        searchStrategy: 'combined'
    },
    // ================================================
    // BUCKET 6: Mobile & UI/UX (5 keywords)
    // Priority: MEDIUM
    // ================================================
    {
        id: 'mobile-ui-design',
        name: 'Mobile & UI/UX',
        description: 'iOS, Android, React Native, UI/UX design roles',
        keywords: [
            'mobile developer',
            'ios developer',
            'android developer',
            'ui/ux designer',
            'react native developer'
        ],
        careerLevel: ['fresher', 'experienced'],
        domain: ['mobile'],
        priority: 6,
        recommendedFrequency: 'twice-weekly',
        searchStrategy: 'combined'
    },
    // ================================================
    // BUCKET 7: QA & Testing (4 keywords)
    // Priority: MEDIUM
    // ================================================
    {
        id: 'qa-testing',
        name: 'QA & Testing',
        description: 'Quality assurance, test automation, manual testing roles',
        keywords: [
            'qa engineer',
            'quality assurance',
            'test automation',
            'manual testing'
        ],
        careerLevel: ['fresher', 'experienced'],
        domain: ['qa'],
        priority: 7,
        recommendedFrequency: 'weekly',
        searchStrategy: 'combined'
    },
    // ================================================
    // BUCKET 8: Non-Tech Roles (6 keywords)
    // Priority: MEDIUM (Support, sales, marketing, operations)
    // ================================================
    {
        id: 'non-tech-roles',
        name: 'Non-Tech Roles',
        description: 'Business, operations, sales, marketing, HR support roles',
        keywords: [
            'business analyst',
            'operations executive',
            'sales executive',
            'marketing executive',
            'customer support',
            'account manager'
        ],
        careerLevel: ['fresher', 'experienced'],
        domain: ['business', 'other'],
        priority: 8,
        recommendedFrequency: 'weekly',
        searchStrategy: 'combined'
    },
    // ================================================
    // BUCKET 9: Experience Level Filters (5 keywords)
    // Priority: UTILITY (Complement other searches)
    // ================================================
    {
        id: 'experience-level',
        name: 'Experience Level Qualifiers',
        description: 'Keywords matching specific experience levels and seniority',
        keywords: [
            '0-2 years',
            '2-5 years',
            'junior',
            'senior',
            'lead'
        ],
        careerLevel: ['fresher', 'experienced', 'lead'],
        domain: ['software', 'data', 'ai', 'cloud'],
        priority: 9,
        recommendedFrequency: 'weekly',
        searchStrategy: 'exact'
    },
    // ================================================
    // BUCKET 10: Employment Type Modifiers (4 keywords)
    // Priority: UTILITY (Complement all searches)
    // ================================================
    {
        id: 'employment-type',
        name: 'Employment Type',
        description: 'Keywords for full-time, part-time, contract roles',
        keywords: [
            'full-time',
            'part-time',
            'contract',
            'freelance'
        ],
        careerLevel: ['fresher', 'experienced'],
        domain: ['software', 'data', 'ai', 'cloud', 'business', 'mobile', 'qa'],
        priority: 10,
        recommendedFrequency: 'weekly',
        searchStrategy: 'exact'
    },
    // ================================================
    // BUCKET 11: Work Mode Modifiers (4 keywords)
    // Priority: UTILITY (Complement all searches)
    // ================================================
    {
        id: 'work-mode',
        name: 'Work Mode',
        description: 'Keywords for remote, hybrid, and on-site work arrangements',
        keywords: [
            'remote',
            'hybrid',
            'work from home',
            'on-site'
        ],
        careerLevel: ['fresher', 'experienced'],
        domain: ['software', 'data', 'ai', 'cloud', 'business', 'mobile', 'qa'],
        priority: 11,
        recommendedFrequency: 'weekly',
        searchStrategy: 'exact'
    }
];
// ============================================
// BUCKET MAPPING HELPERS
// ============================================
const getBucketById = (bucketId) => {
    return exports.ROLE_BUCKETS.find(b => b.id === bucketId);
};
exports.getBucketById = getBucketById;
const getBucketsByPriority = () => {
    return [...exports.ROLE_BUCKETS].sort((a, b) => a.priority - b.priority);
};
exports.getBucketsByPriority = getBucketsByPriority;
const getFresherPriority = () => {
    // Return top priority buckets for fresher-first approach
    return exports.ROLE_BUCKETS.filter(b => b.priority <= 4).sort((a, b) => a.priority - b.priority);
};
exports.getFresherPriority = getFresherPriority;
const getBucketsByDomain = (domain) => {
    return exports.ROLE_BUCKETS.filter(b => b.domain.includes(domain))
        .sort((a, b) => a.priority - b.priority);
};
exports.getBucketsByDomain = getBucketsByDomain;
const getSearchKeywordsCombined = () => {
    // Get all keywords across all buckets for bulk searches
    return [...new Set(exports.ROLE_BUCKETS.flatMap(b => b.keywords))];
};
exports.getSearchKeywordsCombined = getSearchKeywordsCombined;
const getPrimaryBuckets = () => {
    // Get primary (non-utility) buckets
    return exports.ROLE_BUCKETS.filter(b => !['experience-level', 'employment-type', 'work-mode'].includes(b.id))
        .sort((a, b) => a.priority - b.priority);
};
exports.getPrimaryBuckets = getPrimaryBuckets;
// ============================================
// SCRAPING STRATEGY CONSTANTS
// ============================================
exports.SCRAPING_CONFIG = {
    // Daily scrape (fresher & batch buckets) - Light load
    DAILY_BUCKETS: ['fresher-entry-level', 'batch-hiring', 'software-engineering', 'data-ai-ml'],
    // Twice-weekly scrape (high demand buckets)
    TWICE_WEEKLY_BUCKETS: ['cloud-devops', 'mobile-ui-design'],
    // Weekly scrape (lower priority)
    WEEKLY_BUCKETS: ['qa-testing', 'non-tech-roles', 'experience-level', 'employment-type', 'work-mode'],
    // Results per keyword
    RESULTS_PER_KEYWORD: 15, // Usually fetches 15 results
    // API limits
    API_LIMIT_MONTHLY: 200,
    API_LIMIT_HARD_STOP: 150,
    API_LIMIT_WARNING: 100,
    // Job expiry
    JOB_RETENTION_DAYS: 30,
    JOB_CLEANUP_INTERVAL_DAYS: 7,
    // Deduplication
    ENABLE_DEDUPLICATION: true,
};
exports.BUCKET_KEYWORDS_SUMMARY = {
    'fresher-entry-level': 12,
    'batch-hiring': 4,
    'software-engineering': 9,
    'data-ai-ml': 8,
    'cloud-devops': 7,
    'mobile-ui-design': 5,
    'qa-testing': 4,
    'non-tech-roles': 6,
    'experience-level': 5,
    'employment-type': 4,
    'work-mode': 4,
    'TOTAL': 68,
};

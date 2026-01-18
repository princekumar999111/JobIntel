# Phase 7: Fresher-First Job Aggregation + Matching Platform
## Complete Implementation Guide

---

## 📋 Overview

**Goal:** Design and implement a **fresher-first job aggregation and matching platform** with strict API constraints, MongoDB-only searching, and rule-based matching.

**Key Constraints:**
- ✅ FREE API TIER ONLY: 200 calls/month (hard stop at 150)
- ✅ NO per-user API calls: Admin-controlled batch scraping only
- ✅ FRESHER PRIORITY: 11 role buckets with 68 keywords
- ✅ NO API dependencies for matching: All data cached in MongoDB
- ✅ 30-day job expiry: Auto-cleanup system
- ✅ Safe deduplication: Hash-based duplicate detection

---

## 🏗️ Architecture Overview

### Phase 1: Scraping & Storage

```
Admin Triggers
    ↓
Role Bucket Selection
    ↓
OpenWeb Ninja JSearch API (with rate limits)
    ↓
Normalize & Tag Jobs
    ↓
Deduplication Check
    ↓
MongoDB ScrapedJob Collection
    ↓
Set Expiry (30 days)
```

### Phase 2: Job Search & Filtering

```
User/Public Search Request
    ↓
MongoDB Query (no API calls)
    ↓
Apply Filters:
  - Career Level
  - Domain
  - Role
  - Tech Stack
  - Work Mode
  - Employment Type
    ↓
Sort Results
  - Recent
  - Popular
  - Relevant
    ↓
Return Paginated Results
```

### Phase 3: Job Matching Engine

```
User Resume + Preferences
    ↓
Rule-Based Scoring:
  - Skill Matching (40%)
  - Role Matching (20%)
  - Level Matching (15%)
  - Experience Matching (10%)
  - Location Preference (10%)
  - Work Mode Preference (5%)
    ↓
MongoDB Query for Matches
    ↓
Score & Rank Jobs
    ↓
Return Top Matched Jobs
```

---

## 📦 MongoDB Collections

### 1. ScrapedJob Collection

```typescript
{
  // Core Information
  _id: ObjectId,
  title: string,           // "Senior Backend Developer"
  company: string,         // "Google"
  location: string,        // "Bangalore, India"
  description: string,     // Full job description
  applyLink: string,       // Direct apply URL

  // Source Tracking
  source: 'openwebninja',
  fetchedAt: Date,         // When scraped
  expiryDate: Date,        // fetchedAt + 30 days
  archived: boolean,       // Soft delete flag

  // Intelligent Tagging
  tags: {
    careerLevel: 'fresher' | 'experienced' | 'lead' | 'manager' | 'intern',
    domain: 'software' | 'data' | 'ai' | 'cloud' | 'business' | 'mobile' | 'qa' | 'other',
    role: string,                      // "Backend Developer"
    techStack: ['Node.js', 'Python'],
    experienceRange: '0-1' | '2-5' | '5+',
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship',
    workMode: 'remote' | 'hybrid' | 'onsite',
    batchEligibility: ['2024', '2025']  // For campus recruitment
  },

  // Deduplication
  jobHash: string,         // MD5(title+company+location)
  isDuplicate: boolean,
  duplicateOf: ObjectId,

  // Engagement Metrics
  appliedCount: number,
  savedCount: number,
  viewCount: number,

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Composite indexes for efficient querying
db.scraped_jobs.createIndex({ 'tags.careerLevel': 1, archived: 1, expiryDate: 1 })
db.scraped_jobs.createIndex({ 'tags.domain': 1, archived: 1, expiryDate: 1 })
db.scraped_jobs.createIndex({ fetchedAt: -1, archived: 1 })
db.scraped_jobs.createIndex({ jobHash: 1 }, { unique: true, sparse: true })

// TTL index - auto-delete archived jobs after 90 days
db.scraped_jobs.createIndex(
  { updatedAt: 1 },
  { expireAfterSeconds: 7776000, partialFilterExpression: { archived: true } }
)
```

### 2. APIUsageLog Collection

```typescript
{
  _id: ObjectId,
  keyword: string,              // "python developer"
  roleBucket: string,           // "software-engineering"
  results_count: number,        // 15
  status: 'success' | 'failed' | 'partial',
  error?: string,               // Error message if failed

  // Results Tracking
  jobsCreated: number,          // New jobs saved
  duplicatesFound: number,      // Duplicates detected
  duplicatesIgnored: number,    // Duplicates skipped

  responseTime: number,         // milliseconds
  executedAt: Date,
  executedBy: ObjectId,         // Admin user ID

  createdAt: Date
}
```

### 3. APIUsageCounter Collection

```typescript
{
  _id: ObjectId,
  month: string,                    // "2024-01"
  totalCalls: number,               // 0-200
  successfulCalls: number,
  failedCalls: number,
  totalResults: number,

  warningTriggered: boolean,        // true at 100+ calls
  hardStopTriggered: boolean,       // true at 150+ calls
  hardStopTime?: Date,

  resetAt: Date,                    // 2024-02-01 (1st of next month)

  createdAt: Date,
  updatedAt: Date
}
```

---

## 🪣 Role Bucket System (11 Categories, 68 Keywords)

### Bucket 1: Fresher Entry Level (12 keywords) - Priority 1
**Best for:** Recent graduates, first-time job seekers (0-1 years)

Keywords:
- fresher, entry level, graduate engineer, junior developer
- trainee, intern, graduate program, campus recruit
- new graduate, first job, 0-1 year, no experience required

### Bucket 2: Batch-based Hiring (4 keywords) - Priority 2
**Best for:** Campus recruitment (Batch 2024, 2025, 2026)

Keywords:
- batch hiring, campus recruitment, batch 2024, batch 2025

### Bucket 3: Software Engineering (9 keywords) - Priority 3
**Best for:** Largest demand sector

Keywords:
- software engineer, backend developer, frontend developer
- fullstack developer, web developer, nodejs developer
- react developer, python developer, java developer

### Bucket 4: Data/AI/ML (8 keywords) - Priority 4
**Best for:** Growing sector

Keywords:
- data scientist, data analyst, machine learning engineer
- ai engineer, ml engineer, deep learning, data engineering, nlp engineer

### Bucket 5: Cloud & DevOps (7 keywords) - Priority 5
Keywords:
- devops engineer, cloud engineer, aws engineer
- kubernetes engineer, infrastructure engineer, site reliability engineer, gcp engineer

### Bucket 6: Mobile & UI/UX (5 keywords) - Priority 6
Keywords:
- mobile developer, ios developer, android developer, ui/ux designer, react native developer

### Bucket 7: QA & Testing (4 keywords) - Priority 7
Keywords:
- qa engineer, quality assurance, test automation, manual testing

### Bucket 8: Non-Tech Roles (6 keywords) - Priority 8
Keywords:
- business analyst, operations executive, sales executive
- marketing executive, customer support, account manager

### Bucket 9: Experience Level Filters (5 keywords) - Priority 9 (Utility)
Keywords:
- 0-2 years, 2-5 years, junior, senior, lead

### Bucket 10: Employment Type Modifiers (4 keywords) - Priority 10 (Utility)
Keywords:
- full-time, part-time, contract, freelance

### Bucket 11: Work Mode Modifiers (4 keywords) - Priority 11 (Utility)
Keywords:
- remote, hybrid, work from home, on-site

**Scraping Strategy:**
```
DAILY (Fresher & Batch):
  - Fresher Entry Level
  - Batch-based Hiring
  - Software Engineering
  - Data/AI/ML

TWICE-WEEKLY:
  - Cloud & DevOps
  - Mobile & UI/UX

WEEKLY:
  - QA & Testing
  - Non-Tech Roles
  - Experience Level
  - Employment Type
  - Work Mode
```

---

## 🔌 API Endpoints

### Public/User Endpoints (NO AUTHENTICATION)

#### Search & Filter
```
GET /api/jobs/search
Query: careerLevel, domain, role, techStack[], employmentType, workMode, search, sortBy, page, limit
Response: { jobs[], pagination }
Example: /api/jobs/search?domain=software&careerLevel=fresher&page=1&limit=20

GET /api/jobs/trending
Response: Top 10 trending jobs (by appliedCount, viewCount)

GET /api/jobs/fresh
Response: Most recent 10 jobs (by fetchedAt)

GET /api/jobs/domain/{domain}
Response: Jobs filtered by domain

GET /api/jobs/fresher
Response: Fresher-specific jobs (0-1 years)

GET /api/jobs/stats
Response: { totalJobs, fresherJobs, batchJobs, workModeBreakdown, domainBreakdown }

GET /api/jobs/{jobId}
Response: Single job (increments viewCount)
```

### Authenticated User Endpoints

```
POST /api/jobs/{jobId}/applied
Auth: JWT token
Response: { success, message }
(Increments appliedCount for job)
```

### Admin Endpoints (AUTH + ADMIN ROLE REQUIRED)

#### Bucket Management
```
GET /api/admin/scraper/buckets
Query: stats=true|false, priority=fresher|primary
Response: List of all role buckets with keyword counts

GET /api/admin/scraper/buckets/{bucketId}
Response: Specific bucket details with all keywords
```

#### API Usage Monitoring
```
GET /api/admin/scraper/usage
Response: {
  canMakeCall: boolean,
  limitStatus: { allowed, current, remaining, limit },
  summary: { totalCalls, successfulCalls, failedCalls, totalResults, ... }
}

GET /api/admin/scraper/history
Response: {
  currentMonth: "2024-01",
  apiUsage: { totalCalls, successfulCalls, ... },
  recentScrapings: [ { keyword, status, jobsCreated, ... } ]
}
```

#### Scraping Operations
```
POST /api/admin/scraper/buckets/{bucketId}
Body: {}
Response: { success, details: { totalJobsScraped, jobsCreated, duplicatesFound } }

POST /api/admin/scraper/fresher-priority
Body: {}
Response: { success, bucketsScraped, totalJobsCreated, results[] }
(Scrapes top 4 fresher-priority buckets)

POST /api/admin/scraper/all-buckets
Body: {}
Response: { success, bucketsScraped, totalJobsCreated, results[] }
(Scrapes all 11 buckets with rate limit checking)
```

#### Job Management
```
POST /api/admin/jobs/cleanup
Response: { success, modifiedCount }
(Archives expired jobs, triggers TTL deletion)
```

---

## 🔐 API Rate Limiting Strategy

### Monthly Quota
- **Total Limit:** 200 calls/month
- **Hard Stop:** 150 calls (prevents overages)
- **Warning:** 100 calls (notification)
- **Free Tier:** Forever (no paid tier)

### Implementation

1. **Per-Bucket Scraping:**
   ```typescript
   // Each keyword = 1 API call
   // Bucket 1 (Fresher): 12 calls
   // Bucket 2 (Batch): 4 calls
   // ...
   // Total per full scrape: ~68 calls
   
   // Strategy: Scrape fresher buckets 2x/month, others 1x/month
   // Usage: 28 + 10 + 10 + 10 = ~58 calls/month (safe)
   ```

2. **Rate Limit Checks:**
   ```typescript
   // Before each API call
   const canCall = await scraper.canMakeAPICall();
   if (!canCall.allowed) {
     throw new Error(canCall.reason);
   }

   // Hard stop at 150 calls
   if (totalCalls >= 150) {
     hardStopTriggered = true;
     // No more API calls allowed
   }
   ```

3. **Monthly Reset:**
   ```typescript
   // Automatic via APIUsageCounter.resetAt
   // Scheduled for 1st of each month at 00:00 UTC
   ```

---

## 💼 Job Matching Engine

### Matching Algorithm (Rule-Based)

```typescript
interface JobMatchResult {
  jobId: string;
  matchScore: number;           // 0-100
  matchBreakdown: {
    skills: number;             // 40%
    role: number;               // 20%
    level: number;              // 15%
    experience: number;         // 10%
    location: number;           // 10%
    workMode: number;           // 5%
  };
  matchedSkills: string[];
  recommendedMatch: boolean;    // score >= 70
}
```

### Scoring Formula

1. **Skill Matching (40%)**
   - Count overlaps between resume skills & job techStack
   - Score = (matchedSkills / jobTechStackSize) * 100
   - Capped at 40 points

2. **Role Matching (20%)**
   - Compare resume role with job role
   - Exact match = 20 points
   - Partial match (keyword overlap) = 10 points
   - No match = 0 points

3. **Career Level Matching (15%)**
   - Resume level matches job level = 15 points
   - Resume level < job level = 10 points
   - Resume level > job level = 5 points

4. **Experience Matching (10%)**
   - Resume exp >= job exp = 10 points
   - Resume exp < job exp by 1 level = 5 points
   - Resume exp << job exp = 0 points

5. **Location Preference (10%)**
   - Exact match = 10 points
   - Remote + prefers remote = 10 points
   - Hybrid + doesn't prefer onsite = 8 points
   - No match = 0 points

6. **Work Mode Preference (5%)**
   - Job matches preference = 5 points
   - Otherwise = 0 points

**Total Possible Score: 100**
**Recommendation Threshold: 70+**

---

## 🔄 Job Expiry & Cleanup

### Expiry Strategy

```typescript
// When job is scraped
expiryDate = fetchedAt + 30 days

// Query only non-expired, non-archived jobs
db.scraped_jobs.find({
  archived: false,
  expiryDate: { $gt: new Date() }
})

// Cleanup process
1. Mark as archived: archived = true
2. MongoDB TTL: Auto-delete after 90 days
3. Admin trigger: POST /api/admin/jobs/cleanup
```

### Automatic Cleanup

```typescript
// TTL Index Definition
{
  key: { updatedAt: 1 },
  expireAfterSeconds: 7776000,      // 90 days
  partialFilterExpression: {
    archived: true
  }
}

// MongoDB runs this hourly
// Deletes archived jobs older than 90 days
```

---

## 🔄 Data Flow Examples

### Example 1: Admin Scrapes Fresher Bucket

```
Admin clicks "Scrape Fresher Jobs"
  ↓
Check API usage: 45/150 calls used ✓
  ↓
Fetch 12 keywords from Fresher bucket
  ↓
For each keyword:
  - Call OpenWeb Ninja API (1 call)
  - Get ~15 results
  - For each result:
    - Generate jobHash
    - Check if duplicate (query by jobHash)
    - If new: extract tags, create document
    - If duplicate: increment duplicatesFound
  ↓
Create 12 API usage logs
  ↓
Update APIUsageCounter: 45 → 57 calls
  ↓
Return: { jobsScraped: 180, jobsCreated: 165, duplicates: 15 }
```

### Example 2: User Searches for Frontend Jobs

```
User filters:
  domain=software
  role=frontend
  careerLevel=fresher
  workMode=remote
  
  ↓
MongoDB Query:
  {
    archived: false,
    expiryDate: { $gt: now },
    'tags.domain': 'software',
    'tags.role': /frontend/i,
    'tags.careerLevel': 'fresher',
    'tags.workMode': 'remote'
  }
  .sort({ fetchedAt: -1 })
  .skip(0)
  .limit(20)
  
  ↓
Return 20 jobs + pagination info
  
  ↓
User clicks job → viewCount++
```

### Example 3: User Gets Matched Jobs

```
User has:
  - Resume with skills: ['Python', 'React', 'Node.js', 'MongoDB']
  - Preferences: remote, full-time, 30-50K salary
  - Career level: fresher

  ↓
Job Matcher queries MongoDB:
  {
    archived: false,
    expiryDate: { $gt: now },
    'tags.careerLevel': 'fresher',
    'tags.workMode': 'remote',
    'tags.employmentType': 'full-time'
  }
  
  ↓
For each matching job:
    - Calculate skill overlap: 3/4 techs matched = 75% → 30 pts
    - Role match: 'Frontend' vs 'React Developer' = partial → 10 pts
    - Level: fresher = fresher = exact → 15 pts
    - Experience: 0-1 = 0-1 = exact → 10 pts
    - Location: remote = prefers remote = exact → 10 pts
    - Work mode: remote preferred → 5 pts
    
    Total = 30+10+15+10+10+5 = 80 pts ✓ (RECOMMENDED)
  
  ↓
Return jobs sorted by score (80, 75, 70, ...)
```

---

## 📊 Admin Monitoring Dashboard

### Metrics to Track

**API Usage:**
```
├─ Current month: January 2024
├─ Total calls: 57/150
├─ Successful: 56
├─ Failed: 1
├─ Total results: 840
├─ Warning triggered: No (at 100+)
├─ Hard stop triggered: No (at 150+)
└─ Reset date: Feb 1, 2024
```

**Job Statistics:**
```
├─ Total jobs: 3,420
├─ Active (non-archived): 3,200
├─ Expired: 220
├─ Fresher-specific: 1,450
├─ Batch-eligible: 580
├─ By domain:
│  ├─ Software: 1,200
│  ├─ Data/AI: 680
│  ├─ Cloud: 420
│  ├─ Mobile: 320
│  └─ QA: 180
└─ By work mode:
   ├─ Remote: 1,800
   ├─ Hybrid: 900
   └─ Onsite: 500
```

**Scraping History (Recent):**
```
1. Jan 15, 10:00 | python developer | software-engineering | ✓ | 15 results | 12 created
2. Jan 14, 14:30 | java developer | software-engineering | ✓ | 15 results | 11 created
3. Jan 13, 09:00 | batch 2025 | batch-hiring | ✓ | 12 results | 10 created
4. Jan 12, 16:45 | data analyst | data-ai-ml | ✗ | Error: timeout
5. ...
```

---

## 🛠️ Implementation Checklist

### Phase 1: Database & Models
- ✅ ScrapedJob model with all fields & indexes
- ✅ APIUsageLog model for tracking
- ✅ APIUsageCounter model for limits
- ✅ Role Buckets configuration (11 categories, 68 keywords)

### Phase 2: Backend Services
- ✅ JobScraperService (API calls, deduplication, rate limiting)
- ✅ JobSearchService (MongoDB queries, filtering, sorting)
- ✅ Tag extraction (automatic from descriptions)

### Phase 3: Controllers & Routes
- ✅ adminScraperController (scraping management)
- ✅ jobSearchController (search, stats, matching)
- ✅ jobRoutes (all API endpoints)

### Phase 4: Admin Interface
- ⏳ Admin dashboard for API monitoring
- ⏳ Bucket selection & scraping trigger
- ⏳ Usage history visualization
- ⏳ Job stats & analytics

### Phase 5: User Interface
- ⏳ Job search & filtering page
- ⏳ Fresh jobs showcase
- ⏳ Fresher-focused section
- ⏳ Matched jobs integration

### Phase 6: Integration & Testing
- ⏳ Wire up frontend to API
- ⏳ Test all endpoints
- ⏳ Verify rate limits
- ⏳ Load test with 1000+ jobs

---

## 🚀 Deployment Checklist

1. **Environment Variables:**
   ```env
   OPENWEBNINJA_API_KEY=your_api_key
   DB_NAME=jobintel
   MONGODB_URI=mongodb+srv://...
   NODE_ENV=production
   ```

2. **Database Setup:**
   ```bash
   # Create indexes
   npm run db:seed-indexes
   
   # Verify collections
   db.scraped_jobs.getIndexes()
   db.api_usage_logs.getIndexes()
   db.api_usage_counters.getIndexes()
   ```

3. **API Testing:**
   ```bash
   # Test public endpoints
   curl http://localhost:3000/api/jobs/search?domain=software
   
   # Test admin endpoints (with auth)
   curl -H "Authorization: Bearer {token}" \
        http://localhost:3000/api/admin/scraper/usage
   ```

4. **Scheduled Jobs:**
   ```typescript
   // Cleanup expired jobs daily at 2 AM UTC
   0 2 * * * pm2 trigger 'cleanup-jobs'
   
   // Reset usage counter on 1st of month
   0 0 1 * * pm2 trigger 'reset-usage'
   ```

---

## 📝 Summary

This **Fresher-First Job Aggregation + Matching Platform** provides:

✅ **Safe API Usage:** Hard-capped at 150 calls/month
✅ **Intelligent Scraping:** 11 role buckets with 68 keywords
✅ **Fast Search:** MongoDB-only querying (no API calls)
✅ **Smart Matching:** Rule-based scoring engine
✅ **Auto-Cleanup:** TTL-based job expiry management
✅ **Admin Control:** Complete visibility into API usage & jobs
✅ **Fresher-First:** Optimized for students & recent graduates

**Total Architecture:** 5 MongoDB models, 8 services, 12+ endpoints, with complete rate limiting and deduplication.

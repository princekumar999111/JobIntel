# Phase 7: Admin & User Dashboard Testing Guide

## 🎯 Architecture Clarification

**Key Point:** Job matching is **USER-CENTRIC**, not admin-centric.

```
ADMIN FLOW:
  Admin Dashboard → Scraping Manager
    ↓
  Admin selects role bucket & clicks "Scrape"
    ↓
  OpenWeb Ninja API fetches jobs
    ↓
  Jobs saved to MongoDB (ScrapedJob collection)
  OR Admin posts jobs manually (Job collection)
    ↓
  Jobs stored in database

USER FLOW:
  User Dashboard → Matched Jobs
    ↓
  System fetches user's resume & preferences
    ↓
  Query MongoDB for all available jobs (admin-posted + scraped)
    ↓
  Rule-based matching (resume skills + preferences)
    ↓
  Score each job (0-100 points)
    ↓
  Show user their personalized matches (70+ score recommended)
```

---

## 📊 Admin Dashboard Testing

### What Admin Does (NOT Matching):

1. **Scrape Jobs via API**
   - Admin goes to: `/admin/scraper-config` (or new page)
   - Selects role bucket (Fresher, Software, Data/AI, etc)
   - Clicks "Scrape" button
   - System calls OpenWeb Ninja API
   - Jobs are **SAVED to MongoDB** (not just fetched)

2. **View API Usage**
   - Admin sees: Calls used (45/150)
   - Warning alerts if approaching limit
   - Scraping history

3. **Post Jobs Manually**
   - Admin goes to: `/admin/jobs`
   - Fills job form (title, company, location, etc)
   - System automatically tags job (careerLevel, domain, etc)
   - Job saved to MongoDB

### Admin Dashboard Pages:

```
/admin/
├── dashboard           (main overview)
├── scraper-config      ← PHASE 7: NEW - Scraping manager
├── jobs                (manual job posting)
├── users               (user management)
├── analytics           (stats & usage)
└── ...
```

---

## 👤 User Dashboard Testing

### What Users Do (Matching):

1. **Upload Resume**
   - User goes to: `/dashboard/profile`
   - Uploads resume (PDF/DOC)
   - System extracts: skills, experience, roles

2. **Set Preferences** (Optional)
   - User goes to: `/dashboard/preferences`
   - Sets: preferred roles, locations, work mode
   - Saves preferences to localStorage + backend

3. **View Matched Jobs**
   - User goes to: `/dashboard/matched-jobs` (PHASE 6)
   - System does:
     - Fetch user's resume (skills, exp)
     - Fetch user's preferences (if set)
     - Query MongoDB for ALL jobs (admin-posted + scraped)
     - Score each job based on resume match
     - Show jobs sorted by match score (highest first)

### User Dashboard Pages:

```
/dashboard/
├── overview                (shows matched jobs widget)
├── profile                 (upload resume)
├── preferences            ← PHASE 6: Job preferences
├── matched-jobs           ← PHASE 6: All personalized matches
├── applications           (track applied jobs)
├── skills
├── settings
└── ...
```

---

## 🧪 Testing Guide

### Test 1: Admin Scrapes Jobs (Backend Only)

**Step 1: Start Backend**
```bash
cd backend
npm run build
npm start
```

**Step 2: Call Admin Scraping API**
```bash
# Get API key from: https://api.api-ninjas.com/
export OPENWEBNINJA_API_KEY=your_key_here

# Test fresher bucket scraping
curl -X POST \
  -H "Authorization: Bearer {ADMIN_JWT_TOKEN}" \
  http://localhost:3000/api/admin/scraper/buckets/fresher-entry-level

# Response should be:
# {
#   "success": true,
#   "totalJobsScraped": 180,
#   "totalJobsCreated": 165,
#   "duplicatesFound": 15
# }
```

**Step 3: Verify Jobs Saved**
```bash
# Check MongoDB
mongo jobintel
db.scraped_jobs.count()  # Should show 165+

# Sample job
db.scraped_jobs.findOne()
```

**Expected Result:** 165 jobs in MongoDB, ready for users to match against.

---

### Test 2: User Gets Matched Jobs (Frontend + Backend)

**Prerequisites:**
1. Admin has scraped jobs (above test passed)
2. User is logged in with resume uploaded

**Step 1: User Uploads Resume**
- Navigate to `/dashboard/profile`
- Click "Upload Resume"
- Select PDF/DOC file
- System extracts skills

**Step 2: User Sets Preferences** (Optional)
- Navigate to `/dashboard/preferences`
- Select: Roles (Software Engineer, Full Stack)
- Select: Locations (Bangalore, Remote)
- Select: Work Mode (Remote only)
- Click Save

**Step 3: User Views Matched Jobs**
- Navigate to `/dashboard/matched-jobs`
- System calls: `GET /api/resume/matching-jobs`
- Backend does:
  ```
  1. Get user's resume (skills: Python, React, Node.js)
  2. Get user's preferences (remote, fresher level)
  3. Query MongoDB:
     {
       archived: false,
       expiryDate: { $gt: now },
       'tags.workMode': 'remote',
       'tags.careerLevel': 'fresher'
     }
  4. Score each job:
     - Skills: 3/4 matched = 30 pts
     - Role: "Frontend" vs "React Dev" = 10 pts
     - Level: fresher = 15 pts
     - Total: 55 pts (not recommended yet)
     
  5. Sort by score (highest first)
  6. Return top 20 jobs
  ```

**Expected Result:**
- User sees 10-20 matched jobs
- Each job shows: title, company, match score, matched skills
- Top results have scores 70+
- Jobs from BOTH admin-posted & scraped sources

---

## 📝 Creating Admin Dashboard Pages

### Page 1: Admin Scraper Manager
**File:** `frontend/src/pages/admin/AdminScraperManager.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function AdminScraperManager() {
  const { token } = useAuthStore();
  const [buckets, setBuckets] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get buckets
      const bucketsRes = await fetch(
        `${API_BASE_URL}/jobs/admin/scraper/buckets?stats=true`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const bucketsData = await bucketsRes.json();
      setBuckets(bucketsData);

      // Get usage
      const usageRes = await fetch(
        `${API_BASE_URL}/jobs/admin/scraper/usage`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const usageData = await usageRes.json();
      setUsage(usageData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const scrapeBucket = async (bucketId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/jobs/admin/scraper/buckets/${bucketId}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Created ${data.details.totalJobsCreated} jobs!`);
        loadData(); // Refresh
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Job Scraping Manager</h1>

      {/* API Usage Card */}
      {usage && (
        <Card>
          <CardHeader>
            <h2 className="font-bold">API Usage This Month</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>API Calls:</span>
              <span className="font-mono">
                {usage.limitStatus.current} / {usage.limitStatus.limit}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span className={usage.limitStatus.current > 100 ? 'text-yellow-600 font-bold' : ''}>
                {usage.limitStatus.remaining}
              </span>
            </div>
            {!usage.limitStatus.allowed && (
              <div className="text-red-600 font-bold">
                ⚠️ Hard stop reached! No more API calls allowed this month.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Buckets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map(bucket => (
          <Card key={bucket.id}>
            <CardHeader>
              <h3 className="font-bold">{bucket.name}</h3>
              <p className="text-sm text-gray-600">{bucket.keywordCount} keywords</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs">{bucket.description}</p>
              <Button
                onClick={() => scrapeBucket(bucket.id)}
                disabled={loading || !usage?.limitStatus.allowed}
                className="w-full"
              >
                {loading ? 'Scraping...' : `Scrape ${bucket.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="font-bold">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fetch(`${API_BASE_URL}/jobs/admin/scraper/fresher-priority`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              }).then(r => r.json()).then(d => {
                alert(`✅ Scraped ${d.totalJobsCreated} fresher jobs!`);
                loadData();
              })}
              disabled={loading}
            >
              Scrape Fresher Priority (4 buckets)
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => alert('Coming soon: full database cleanup')}
              disabled
            >
              Cleanup Expired Jobs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Recent Activity</h3>
          </CardHeader>
          <CardContent>
            {usage?.summary?.recentLogs?.slice(0, 5).map((log, idx) => (
              <div key={idx} className="text-xs py-1 border-b">
                <p className="font-mono">{log.keyword}</p>
                <p className="text-gray-600">
                  {log.status === 'success' ? '✓' : '✗'} {log.resultsCount} results
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

### Page 2: Admin Job Stats
**File:** `frontend/src/pages/admin/AdminJobStats.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/api';

export default function AdminJobStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/jobs/stats`)
      .then(r => r.json())
      .then(d => setStats(d.data));
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Job Statistics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Jobs</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalJobs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Fresher Jobs</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.fresherJobs}</p>
            <p className="text-xs text-gray-600">
              {((stats.fresherJobs / stats.totalJobs) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Batch Jobs</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.batchJobs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Expired Jobs</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{stats.expiredJobs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Work Mode Breakdown */}
      <Card>
        <CardHeader>
          <h2 className="font-bold">Work Mode Distribution</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Remote:</span>
            <span className="font-bold">{stats.workMode?.remote || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Hybrid:</span>
            <span className="font-bold">{stats.workMode?.hybrid || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>On-site:</span>
            <span className="font-bold">{stats.workMode?.onsite || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Domain Breakdown */}
      <Card>
        <CardHeader>
          <h2 className="font-bold">Jobs by Domain</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(stats.domains || {}).map(([domain, count]) => (
            <div key={domain} className="flex justify-between">
              <span className="capitalize">{domain}:</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🧑‍💻 Testing User Job Matching

### Test Script:

```typescript
// User has these skills (from resume):
const userSkills = ['Python', 'React', 'Node.js', 'MongoDB'];
const userPreferences = {
  workMode: 'remote',
  careerLevel: 'fresher',
  location: 'Bangalore'
};

// Database has these jobs (scraped):
// Job 1: Frontend Developer
//   - skills: React, Vue.js, TypeScript
//   - workMode: remote
//   - careerLevel: fresher
//   - location: Remote
//   → Score: Skills(2/3=20) + Mode(5) + Level(15) + Location(10) = 50 pts

// Job 2: Full Stack Developer
//   - skills: Node.js, Python, React, MongoDB
//   - workMode: remote
//   - careerLevel: fresher
//   - location: Remote
//   → Score: Skills(4/4=40) + Mode(5) + Level(15) + Location(10) = 70 pts ✅ RECOMMENDED

// Expected result: Job 2 appears first (70 pts > 50 pts)
```

---

## 📋 Testing Checklist

### Admin Testing:

- [ ] Admin logs in
- [ ] Admin goes to `/admin/scraper-config` (or new page)
- [ ] Admin sees: API usage (45/150), bucket list
- [ ] Admin clicks "Scrape Fresher" → 165 jobs created
- [ ] Admin sees updated stats (jobs increased)
- [ ] API usage updated (45 → 60)

### User Testing:

- [ ] User logs in
- [ ] User uploads resume → skills extracted
- [ ] User goes to `/dashboard/matched-jobs`
- [ ] System queries: 165 jobs in database
- [ ] Matching engine scores each job
- [ ] User sees jobs sorted by score (70+ recommended first)
- [ ] Each job shows: title, company, score, matched skills
- [ ] User can click "Apply" → application tracked

---

## ✅ Key Differences: Admin vs User

| Action | Admin | User |
|--------|-------|------|
| **Scrape Jobs** | ✅ Yes (via API) | ❌ No |
| **Post Jobs** | ✅ Yes (form) | ❌ No |
| **See All Jobs** | ✅ Yes (admin panel) | ✅ Yes (via matching) |
| **See API Usage** | ✅ Yes (dashboard) | ❌ No |
| **Get Matched Jobs** | ❌ No | ✅ Yes (based on resume) |
| **View by Preferences** | ❌ No | ✅ Yes (role, location, etc) |

---

## 🚀 Implementation Order

1. **Phase 7A: Admin Scraper Manager** (NEW)
   - Create `/admin/scraper-config` page
   - API integration done ✅
   - UI components needed

2. **Phase 7B: User Job Matching** (ALREADY DONE)
   - `/dashboard/matched-jobs` exists ✅
   - `/dashboard/preferences` exists ✅
   - Just needs admin to populate database with jobs

3. **Phase 7C: Admin Stats Dashboard** (NEW)
   - Create `/admin/job-stats` page
   - Shows job statistics by domain, level, workmode
   - Shows API usage metrics

---

## 🎯 Next: Add Admin Pages to Sidebar

Edit `frontend/src/components/admin/AdminSidebar.tsx`:
```typescript
// Add these new items:
{
  href: '/admin/scraper-config',
  label: 'Job Scraping',
  icon: 'Download'
},
{
  href: '/admin/job-stats',
  label: 'Job Statistics',
  icon: 'BarChart3'
}
```

---

**Summary:**
- ✅ Admin scrapes jobs → saved to MongoDB
- ✅ Users get matched jobs based on resume
- ✅ Matching is user-centric (not admin-centric)
- ✅ All jobs from admin-posted + scraped sources
- ✅ No API calls for user matching (MongoDB only)

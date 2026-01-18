# Phase 7: Quick Testing Guide
## Admin & User Testing Workflow (5 Minutes)

### Prerequisites
```bash
# Terminal 1 - Backend
cd backend && npm run dev
# Wait for: ✅ Server running on http://localhost:4000

# Terminal 2 - Frontend  
cd frontend && npm run dev
# Wait for: ✅ Local: http://localhost:5173
```

---

## TEST 1: Admin Scraping (2 minutes)

### Quick Steps:
```
1. Browser: http://localhost:5173
2. Login as admin (role: "admin")
3. Go to: /admin/job-scraping
4. See: API usage card (should show 0/200)
5. Click: "🎓 Scrape Fresher Priority (4 buckets)"
6. Wait: 3-5 seconds
7. See: Alert "✅ Success! Jobs Scraped: XX"
8. Verify: API usage increased (e.g., 0 → 4)
```

### What's Happening:
- Admin calls OpenWeb Ninja API
- API returns job listings
- Backend saves to MongoDB
- Rate limiting tracks usage
- All saved in `ScrapedJob` collection

**Expected:** 50-200+ jobs scraped from 4 buckets

---

## TEST 2: Admin Statistics (2 minutes)

### Quick Steps:
```
1. Go to: /admin/job-stats
2. See: KPI cards (Total, Fresher, Domains, Last 24h)
3. Scroll: View distribution charts
   - By Career Level
   - By Work Mode
   - Top Domains
   - Top Roles
4. Verify: High number of "Fresher" jobs
5. Note: Trending and Fresher job lists
```

### What's Happening:
- System aggregates all jobs in database
- Calculates statistics
- Groups by career level, mode, domain, role
- Identifies trending jobs

**Expected:** Stats match jobs from previous scrape

---

## TEST 3: User Job Matching (3 minutes)

### Quick Steps - Part A: Upload Resume
```
1. Open INCOGNITO tab (different user)
2. Login as user (role: "user")
3. Go to: /dashboard/resume
4. Upload any resume file (PDF/DOC)
5. See: Skills extracted
6. Click: Save
```

### Quick Steps - Part B: Set Preferences
```
7. Go to: /dashboard/preferences
8. Select: Career Level = "Fresher"
9. Select: Domain = "Software"
10. Click: Save Preferences
```

### Quick Steps - Part C: View Matches
```
11. Go to: /dashboard/matched-jobs
12. See: Job list with match scores
13. Jobs should be:
    - Marked as Fresher level
    - Related to Software domain
    - Sorted by match score (highest first)
14. See: "Apply" button on each job
```

### What's Happening:
- Resume skills extracted
- Preferences saved
- Matching engine runs:
  - Skills vs job requirements: 40%
  - Role match: 20%
  - Career level: 15%
  - Domain/tags: 15%
  - Work mode: 10%
- Results sorted by score (70+ recommended)

**Expected:** 10-50+ matched jobs shown

---

## Success Criteria ✅

| Component | Success | Notes |
|-----------|---------|-------|
| **Admin Scraping** | Jobs count increases | ~50+ jobs after fresher scrape |
| **API Usage** | Counter increments | 0 → 4 after one scrape |
| **Job Storage** | MongoDB has data | Check: `db.scrapedJobs.count()` |
| **Admin Stats** | Charts show data | Fresher count > other levels |
| **User Resume** | Upload succeeds | Skills extracted |
| **User Matching** | Jobs appear | 10+ matches shown |
| **Match Scores** | Reasonable scores | 70-100 for good matches |
| **UI Rendering** | No console errors | Check DevTools → Console |

---

## Troubleshooting

### "No jobs appearing"
```
→ Check: Did you run the scrape in TEST 1?
→ Fix: Run scrape again before testing user matches
```

### "API calls failing"
```
→ Check: Backend running? (should see logs)
→ Check: Token valid? (re-login if stuck)
→ Check: Network tab → See actual error
```

### "Build errors"
```
→ Fix: npm install (in frontend/backend)
→ Fix: npm run build (check for TypeScript errors)
→ Fix: npm run dev (restart dev server)
```

### "MongoDB connection error"
```
→ Ensure: mongod is running locally
→ OR ensure: .env has MONGODB_URI set
→ Check: Backend logs for connection message
```

---

## Network Testing (Optional)

### Check Admin API Endpoints:
```bash
# Test scraping endpoint
curl -X POST http://localhost:4000/api/jobs/admin/scraper/buckets/fresher \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected: { success: true, details: {...} }
```

### Check User Matching:
```bash
# Test matching endpoint
curl http://localhost:4000/api/resume/matching-jobs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: { jobs: [...] }
```

---

## Timeline

| Phase | Time | Task |
|-------|------|------|
| 1 | 0:00 | Start backend & frontend |
| 2 | 0:30 | Login as admin |
| 3 | 1:30 | Run admin scrape test |
| 4 | 2:00 | View admin statistics |
| 5 | 2:30 | Login as user (incognito) |
| 6 | 3:00 | Upload resume |
| 7 | 3:30 | Set preferences |
| 8 | 4:00 | View matched jobs |
| 9 | 5:00 | Verify results ✅ |

---

## Key Files to Monitor

### Backend Logs:
```
backend/src/controllers/adminScraperController.ts  (scraping)
backend/src/services/jobSearch.ts                 (matching)
backend/src/routes/jobRoutes.ts                   (endpoints)
```

### Frontend Pages:
```
frontend/src/pages/admin/AdminScraperManager.tsx  (admin UI)
frontend/src/pages/admin/AdminJobStats.tsx        (stats UI)
frontend/src/pages/dashboard/MatchedJobs.tsx      (user UI)
```

### Database Collections:
```
scrapedJobs      (jobs from API)
jobs             (admin-posted jobs)
resume           (user resumes)
apiUsageLog      (API call tracking)
apiUsageCounter  (monthly quota)
```

---

## Result Summary

After completing all tests:
- ✅ Admin successfully scraped jobs
- ✅ Jobs visible in admin stats
- ✅ User received personalized matches
- ✅ System working end-to-end
- ✅ No errors or warnings
- ✅ Ready for production

**Status: Phase 7 Complete ✅**

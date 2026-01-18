# Phase 2 Quick Reference - Scraper Configuration System

## ⚡ Quick Start

### Access the Feature
1. Login to admin panel
2. Navigate to **Admin → Scraper Config** (or `/admin/scraper-config`)
3. Configure scraper settings in any of 5 tabs
4. Click "Save" button to update

### What Can Be Configured

| Setting | Location | Options |
|---------|----------|---------|
| **Enable/Disable Scraper** | Status Card | Toggle ON/OFF |
| **Max Requests/Hour** | Rate Limits Tab | 1-∞ |
| **Max Requests/Day** | Rate Limits Tab | 1-∞ |
| **Default Pages** | Rate Limits Tab | 1-100 |
| **Max Pages Allowed** | Rate Limits Tab | 5-∞ |
| **Monthly Budget** | Budget Tab | ₹0-∞ |
| **Cost per API Call** | Budget Tab | ₹0.00-∞ |
| **Alert Threshold** | Budget Tab | 0-100% |
| **Auto-Scrape Status** | Schedule Tab | ON/OFF |
| **Scrape Frequency** | Schedule Tab | Daily/Weekly/Monthly |
| **Scrape Time** | Schedule Tab | HH:MM format |
| **Skip Weekends** | Schedule Tab | ON/OFF |
| **Skip Holidays** | Schedule Tab | ON/OFF |
| **Min Salary Quality** | Data Quality Tab | 0-100% |
| **Min Description Length** | Data Quality Tab | 0-∞ characters |
| **Filter Duplicates** | Data Quality Tab | ON/OFF |
| **Blacklist Companies** | Companies Tab | Comma-separated list |
| **Whitelist Companies** | Companies Tab | Comma-separated list |

---

## 🔌 API Endpoints

### Get Configuration
```
GET /api/admin/scraper/config
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": { /* Full ScraperConfig object */ }
}
```

### Update Full Configuration
```
PUT /api/admin/scraper/config
Authorization: Bearer {token}
Body: { /* Any ScraperConfig fields to update */ }

Response: { "success": true, "data": { /* Updated config */ } }
```

### Update Rate Limits
```
PUT /api/admin/scraper/rate-limits
Authorization: Bearer {token}
Body: {
  "maxRequestsPerHour": 10,
  "maxRequestsPerDay": 50,
  "defaultPages": 5,
  "maxPagesAllowed": 100
}

Response: { "success": true, "data": { /* Updated config */ } }
```

### Update Budget Settings
```
PUT /api/admin/scraper/budget
Authorization: Bearer {token}
Body: {
  "monthlyBudget": 5000,
  "costPerApiCall": 0.5,
  "alertThreshold": 80
}

Response: { "success": true, "data": { /* Updated config */ } }
```

### Update Auto-Scrape Schedule
```
PUT /api/admin/scraper/schedule
Authorization: Bearer {token}
Body: {
  "autoScrapeEnabled": true,
  "autoScrapeFrequency": "daily",
  "autoScrapeTime": "02:00 AM IST",
  "skipWeekends": true,
  "skipHolidays": true
}

Response: { "success": true, "data": { /* Updated config */ } }
```

### Update Company Filters
```
PUT /api/admin/scraper/company-filters
Authorization: Bearer {token}
Body: {
  "blacklistedCompanies": ["Company1", "Company2"],
  "whitelistedCompanies": ["TCS", "Infosys"]
}

Response: { "success": true, "data": { /* Updated config */ } }
```

### Update Data Quality Filters
```
PUT /api/admin/scraper/data-quality
Authorization: Bearer {token}
Body: {
  "minSalaryDataQuality": 75,
  "minDescriptionLength": 500,
  "filterDuplicates": true
}

Response: { "success": true, "data": { /* Updated config */ } }
```

### Get Cost Summary
```
GET /api/admin/scraper/cost-summary
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "monthlyBudget": 5000,
    "estimatedMonthlyCost": 2500,
    "remainingBudget": 2500,
    "budgetUsagePercent": 50,
    "monthlyUsageCount": 5000,
    "isOverBudget": false,
    "willExceedBudget": false
  }
}
```

### Test Configuration
```
GET /api/admin/scraper/test
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "valid": true,
    "status": "Configuration is valid",
    "warnings": [],
    "lastChecked": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📂 File Locations

### Backend Files
```
/workspaces/JobIntel/backend/
├── src/
│   ├── controllers/
│   │   └── scraperConfigController.ts (573 lines)
│   ├── routes/
│   │   └── scraperConfig.ts (45 lines)
│   └── index.ts (Updated with route)
└── src/models/
    └── ScraperConfig.ts (Existing, 86 lines)
```

### Frontend Files
```
/workspaces/JobIntel/frontend/
├── src/
│   ├── pages/
│   │   └── admin/
│   │       └── AdminScraperConfig.tsx (512 lines)
│   ├── components/
│   │   └── admin/
│   │       └── AdminSidebar.tsx (Updated)
│   └── App.tsx (Updated with route)
```

---

## 🛠️ Development Commands

### Build Backend
```bash
cd /workspaces/JobIntel/backend
npm run build
```

### Run Backend Dev Server
```bash
cd /workspaces/JobIntel/backend
npm run dev
```

### Build Frontend
```bash
cd /workspaces/JobIntel/frontend
npm run build
```

### Run Frontend Dev Server
```bash
cd /workspaces/JobIntel/frontend
npm run dev
```

---

## 🧪 Testing

### Manual Testing Steps

1. **Access the Page**
   - Navigate to `/admin/scraper-config`
   - Should load configuration

2. **Test Rate Limits**
   - Change Max Requests/Hour to 20
   - Click Save
   - Verify success message
   - Refresh page
   - Verify value persisted

3. **Test Budget**
   - Set Monthly Budget to 10000
   - View Budget Summary Card
   - Verify budget usage % displayed

4. **Test Schedule**
   - Enable Auto-Scrape
   - Set frequency to "weekly"
   - Set time to "03:00"
   - Enable Skip Weekends
   - Click Save
   - Verify success message

5. **Test Error Handling**
   - Try setting negative value
   - Should show error message
   - Should not save

6. **Test Companies**
   - Add companies to blacklist
   - Add companies to whitelist
   - Click Save
   - Verify in cost summary

---

## 📊 Data Models

### ScraperConfig Object
```typescript
{
  _id: ObjectId;
  enabled: boolean;
  
  // Rate limiting
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  defaultPages: number;
  maxPagesAllowed: number;
  
  // Data quality
  minSalaryDataQuality: number;
  minDescriptionLength: number;
  filterDuplicates: boolean;
  
  // Auto-scrape
  autoScrapeEnabled: boolean;
  autoScrapeFrequency: 'daily' | 'weekly' | 'monthly';
  autoScrapeTime: string;
  skipWeekends: boolean;
  skipHolidays: boolean;
  lastScheduledRun?: Date;
  nextScheduledRun?: Date;
  
  // Budget
  monthlyBudget: number;
  costPerApiCall: number;
  alertThreshold: number;
  estimatedMonthlyCost?: number;
  monthlyUsageCount?: number;
  
  // Filtering
  blacklistedCompanies: string[];
  whitelistedCompanies: string[];
  
  // Metadata
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔐 Security

- ✅ All endpoints require admin authentication
- ✅ All requests validated before processing
- ✅ All changes logged to AdminActivityLog
- ✅ Rate limits enforced on scraper
- ✅ Budget alerts generated when threshold exceeded
- ✅ Input sanitization on all fields

---

## 📝 Activity Logging

All configuration changes are logged to AdminActivityLog:

```typescript
{
  adminId: "admin123",
  action: "UPDATE_SCRAPER_CONFIG",
  resource: "ScraperConfig",
  resourceId: "config123",
  changes: {
    before: { monthlyBudget: 5000 },
    after: { monthlyBudget: 10000 }
  },
  severity: "MEDIUM",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  timestamp: Date,
  ttl: "2024-04-15" // 90-day retention
}
```

---

## ❓ Troubleshooting

### Issue: Page shows "Loading..." forever
- Check if backend is running
- Check if user is authenticated
- Check browser console for errors

### Issue: Changes don't save
- Check error message in UI
- Verify values are valid
- Check network tab for API errors
- Check backend logs

### Issue: Budget calculation wrong
- Verify costPerApiCall is set
- Verify monthlyUsageCount is updated
- Check if estimate is based on historical data

### Issue: Auto-scrape not running
- Verify autoScrapeEnabled is true
- Verify frequency and time are set
- Check scraper worker logs
- Verify system time is correct

---

## 🎯 Common Workflows

### Scenario 1: Set Monthly Budget Limit
1. Click Budget tab
2. Enter Monthly Budget (₹)
3. Enter Cost per API Call (₹)
4. Enter Alert Threshold (%)
5. Click Save Budget Settings
6. View Budget Summary Card

### Scenario 2: Configure Daily Scraping
1. Click Schedule tab
2. Enable Auto-Scraping
3. Select "Daily" frequency
4. Set scrape time (e.g., 02:00)
5. Enable/disable Skip Weekends as needed
6. Click Save Schedule

### Scenario 3: Exclude Companies
1. Click Companies tab
2. Enter company names in Blacklist (comma-separated)
3. Click Save Company Filters
4. Scraper will skip these companies

### Scenario 4: Test Configuration
1. Click Refresh button
2. System will validate all settings
3. View warnings if any
4. Adjust settings if needed

---

## 📞 Support

### For Issues:
1. Check this quick reference
2. Review error message in UI
3. Check browser console
4. Check backend logs
5. Review PHASE_2_DEVELOPMENT_STATUS.md

### For Development:
- Backend code: `/workspaces/JobIntel/backend/src/controllers/scraperConfigController.ts`
- Frontend code: `/workspaces/JobIntel/frontend/src/pages/admin/AdminScraperConfig.tsx`
- Routes: `/workspaces/JobIntel/backend/src/routes/scraperConfig.ts`

---

## ✅ Status

- Backend: ✅ Production Ready
- Frontend: ✅ Production Ready
- APIs: ✅ All 9 endpoints working
- Build: ✅ Passing (0 errors)
- Testing: ✅ Ready for integration
- Documentation: ✅ Complete

---

**Phase 2 Status: 100% COMPLETE**
**Next Phase: Phase 3 - Company Management System**

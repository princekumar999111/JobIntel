# Quick Start Guide - Fixed Connection Issues

## What Was Fixed

The application had a critical connection issue where the frontend was making direct HTTP requests to `http://localhost:4000` instead of using the Vite development proxy. This has been completely resolved.

### Changes Summary
1. ✅ **AdminScraperManager.tsx** - Fixed all API endpoints to use relative paths
2. ✅ **NotificationStore.ts** - Fixed EventSource to use relative path  
3. ✅ **Frontend Build** - 0 errors, 2,665 modules compiled successfully

## How to Run

### 1. Start the Development Servers
```bash
cd /workspaces/JobIntel
npm run dev
```

This will start:
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:4000

### 2. Login with Admin Credentials
Open http://localhost:8080 and use:
- **Email**: `admin@jobscout.local`
- **Password**: `password123`

### 3. Access Admin Pages

After login, you can access:

#### Job Scraping Manager
- URL: http://localhost:8080/admin/job-scraping
- Shows: 11 role buckets for job scraping
- Features: API usage, quick scrape actions, bucket management

#### Job Statistics
- URL: http://localhost:8080/admin/job-stats
- Shows: Job aggregation statistics, trends, insights

## What's Working Now

| Feature | Status |
|---------|--------|
| Frontend build | ✅ 0 errors |
| Backend server | ✅ Listening on :4000 |
| Auth login | ✅ Vite proxy forwarding |
| API endpoints | ✅ Using relative paths |
| Admin pages | ✅ Ready to use |
| Notifications | ✅ SSE via proxy |

## Technical Details

### Request Flow
```
Browser Request
    ↓
Frontend (port 8080)
    ↓
Vite Proxy (/api/*)
    ↓
Backend (port 4000)
    ↓
Response ← Proxy ← Browser
```

### API Calls
All API calls now use relative paths that work through the Vite proxy:
- ✅ `/api/auth/login`
- ✅ `/api/jobs/admin/scraper/buckets`
- ✅ `/api/jobs/admin/scraper/usage`
- ✅ `/api/notifications/stream`

## Troubleshooting

### Issue: Still seeing connection refused errors
**Solution**: 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Stop servers: `Ctrl+C` in terminal
3. Rebuild: `cd frontend && npm run build`
4. Restart: `npm run dev`

### Issue: Blank admin page
**Solution**:
1. Check browser DevTools console (F12)
2. Look for any error messages
3. Verify backend is running (see logs in npm run dev output)

### Issue: Login not working
**Solution**:
1. Verify you're using the correct credentials:
   - Email: `admin@jobscout.local` (not admin@jobintel.local)
   - Password: `password123`
2. Check backend logs for error messages
3. Try in an incognito window to avoid cache issues

## File Structure

```
/workspaces/JobIntel/
├── frontend/
│   ├── vite.config.ts          ← Proxy configured here
│   ├── .env                     ← VITE_API_URL set
│   ├── src/
│   │   ├── pages/admin/
│   │   │   ├── AdminScraperManager.tsx  ← FIXED ✅
│   │   │   └── AdminJobStats.tsx
│   │   ├── store/
│   │   │   ├── authStore.ts    ← Already correct ✅
│   │   │   └── notificationStore.ts ← FIXED ✅
│   │   └── ...
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.ts           ← Server starts here
│   │   ├── routes/jobRoutes.ts ← Admin endpoints
│   │   └── ...
│   └── package.json
└── CONNECTION_FIX_SUMMARY.md   ← Detailed documentation
```

## Next Steps

1. ✅ **Read**: CONNECTION_FIX_SUMMARY.md for technical details
2. ✅ **Test**: Run `npm run dev` and verify login works
3. ✅ **Use**: Access admin pages at `/admin/job-scraping` and `/admin/job-stats`
4. ✅ **Deploy**: For production, set VITE_API_URL to your backend URL

## API Endpoints Available

### Job Scraping (Admin)
- `GET /api/jobs/admin/scraper/buckets?stats=true` - List available buckets
- `POST /api/jobs/admin/scraper/buckets/:bucketId` - Scrape specific bucket
- `GET /api/jobs/admin/scraper/usage` - Get API usage stats
- `POST /api/jobs/admin/scraper/fresher-priority` - Scrape fresher buckets

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Notifications (Real-time)
- `GET /api/notifications/stream` - EventSource SSE stream

## Support

For issues or questions, check:
1. Browser console (F12) for error messages
2. Backend logs (npm run dev output)
3. CONNECTION_FIX_SUMMARY.md for technical reference
4. Verify credentials and API endpoints are correct

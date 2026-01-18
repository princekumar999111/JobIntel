import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function AdminScraperManager() {
  const { token } = useAuthStore();
  const [buckets, setBuckets] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrapingBucket, setScrapingBucket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      if (!token) {
        console.error('No token available');
        setLoading(false);
        return;
      }

      console.log('Fetching buckets from:', `/api/jobs/admin/scraper/buckets?stats=true`);

      const bucketsRes = await fetch(
        `/api/jobs/admin/scraper/buckets?stats=true`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        }
      );

      console.log('Buckets response status:', bucketsRes.status);

      if (bucketsRes.ok) {
        const bucketsData = await bucketsRes.json();
        console.log('Buckets data received:', bucketsData);
        setBuckets(Array.isArray(bucketsData) ? bucketsData : []);
      } else {
        console.error('Buckets API error:', bucketsRes.status, bucketsRes.statusText);
        const errorText = await bucketsRes.text();
        console.error('Error details:', errorText.substring(0, 300));
        setError(`Failed to load buckets: ${bucketsRes.status} ${bucketsRes.statusText}`);
      }

      const usageRes = await fetch(
        `/api/jobs/admin/scraper/usage`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        }
      );

      console.log('Usage response status:', usageRes.status);

      if (usageRes.ok) {
        try {
          const usageData = await usageRes.json();
          console.log('Usage data received:', usageData);
          setUsage(usageData);
        } catch (jsonError) {
          console.error('Failed to parse usage response as JSON:', jsonError);
          const usageText = await usageRes.text();
          console.error('Usage response text:', usageText.substring(0, 200));
          setError(prev => (prev ? prev + ' | Invalid usage response' : 'Invalid usage response'));
        }
      } else {
        console.error('Usage API error:', usageRes.status, usageRes.statusText);
        const usageError = await usageRes.text();
        console.error('Usage error details:', usageError.substring(0, 200));
        setError(prev => (prev ? prev + ` | Failed to load usage: ${usageRes.status}` : `Failed to load usage: ${usageRes.status}`));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error:', error);
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const scrapeBucket = async (bucketId: string) => {
    if (!token) return;

    setScrapingBucket(bucketId);
    try {
      const response = await fetch(
        `/api/jobs/admin/scraper/buckets/${bucketId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert(
          `✅ Success!\n\nJobs Scraped: ${data.details.totalJobsScraped}\nNew Jobs: ${data.details.totalJobsCreated}\nDuplicates: ${data.details.duplicatesFound}`
        );
        loadData();
      } else {
        alert(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setScrapingBucket(null);
    }
  };

  const scrapeFresherPriority = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/jobs/admin/scraper/fresher-priority`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ Success!\n\nBuckets: ${data.bucketsScraped}\nNew Jobs: ${data.totalJobsCreated}`);
        loadData();
      } else {
        alert(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const isHardStop = usage?.limitStatus?.allowed === false;
  const isNearLimit = (usage?.limitStatus?.current || 0) >= 100;

  if (loading && !usage) {
    return (
      <div className="flex items-center justify-center h-96 p-6">
        <div className="text-center">
          <Zap className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading scraper data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Scraping Manager</h1>
        <p className="text-gray-600 mt-2">Manage job scraping and API usage</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-900 font-medium">Error Loading Data</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <p className="text-red-600 text-xs mt-2">Open browser console (F12) for more details</p>
            </div>
          </div>
        </div>
      )}

      {usage && (
        <Card className={isHardStop ? 'border-red-500 bg-red-50' : isNearLimit ? 'border-yellow-500 bg-yellow-50' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">API Usage This Month</h2>
              {isHardStop ? (
                <AlertCircle className="text-red-600" size={24} />
              ) : isNearLimit ? (
                <AlertCircle className="text-yellow-600" size={24} />
              ) : (
                <CheckCircle2 className="text-green-600" size={24} />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">API Calls Used</span>
                <span className="font-mono font-bold">
                  {usage.limitStatus?.current || 0} / {usage.limitStatus?.limit || 200}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    isHardStop ? 'bg-red-600' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      ((usage.limitStatus?.current || 0) / (usage.limitStatus?.limit || 200)) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold">{usage.summary?.successfulCalls || 0}</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-orange-600">{usage.summary?.failedCalls || 0}</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">Total Results</p>
                <p className="text-2xl font-bold">{usage.summary?.totalResults || 0}</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`text-2xl font-bold ${(usage.limitStatus?.remaining || 0) < 50 ? 'text-orange-600' : ''}`}>
                  {usage.limitStatus?.remaining || 0}
                </p>
              </div>
            </div>

            {isHardStop && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                <strong>⚠️ Hard Stop Reached!</strong> No more API calls allowed this month.
              </div>
            )}

            {isNearLimit && !isHardStop && (
              <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                <strong>⚠️ Warning!</strong> Approaching API limit ({usage.limitStatus?.remaining || 0} calls remaining)
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="font-bold flex items-center gap-2">
              <Zap size={18} />
              Quick Actions
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={scrapeFresherPriority}
              disabled={loading || isHardStop}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Scraping...' : '🎓 Scrape Fresher Priority'}
            </Button>
            <p className="text-xs text-gray-600">
              Scrapes 4 buckets: Fresher, Batch, Software, Data/AI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Recommended Schedule</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>📅 <strong>Daily:</strong> Fresher, Software, Data/AI</div>
            <div>📅 <strong>2x/Week:</strong> Cloud, Mobile</div>
            <div>📅 <strong>Weekly:</strong> QA, Non-Tech</div>
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
              <p className="text-xs">~58 calls/month = Safe (200 limit)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Role Buckets ({buckets.length})</h2>
        {buckets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No buckets available. Please try refreshing the page.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buckets.map((bucket: any) => (
              <Card key={bucket.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm">{bucket.name || 'Unknown'}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {bucket.keywordCount || 0} keywords
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      P{bucket.priority || 1}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-gray-600 leading-snug">{bucket.description || 'No description'}</p>
                  <Button
                    onClick={() => scrapeBucket(bucket.id)}
                    disabled={scrapingBucket === bucket.id || isHardStop}
                    variant="outline"
                    className="w-full text-xs h-8"
                  >
                    {scrapingBucket === bucket.id ? '⏳ Scraping...' : '🚀 Scrape'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

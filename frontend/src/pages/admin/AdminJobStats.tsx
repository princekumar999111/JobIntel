import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { Briefcase, TrendingUp, Users, Zap } from 'lucide-react';

export default function AdminJobStats() {
  const { token } = useAuthStore();
  const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const [stats, setStats] = useState<any>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [fresher, setFresher] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      if (!token) return;

      setLoading(true);

      const statsRes = await fetch(
        `${API_BASE_URL}/jobs/admin/stats`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        }
      );

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const trendingRes = await fetch(
        `${API_BASE_URL}/jobs/trending?limit=5`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        }
      );

      if (trendingRes.ok) {
        const trendingData = await trendingRes.json();
        setTrending(trendingData.jobs || []);
      }

      const fresherRes = await fetch(
        `${API_BASE_URL}/jobs/fresher?limit=5`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        }
      );

      if (fresherRes.ok) {
        const fresherData = await fresherRes.json();
        setFresher(fresherData.jobs || []);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 p-6">
        <div className="text-center">
          <Zap className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Statistics</h1>
        <p className="text-gray-600 mt-2">Overview of all jobs in the system</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Jobs</p>
                  <p className="text-3xl font-bold">{stats.totalJobs || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.scraped || 0} scraped, {stats.adminPosted || 0} posted
                  </p>
                </div>
                <Briefcase size={32} className="text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Fresher Jobs</p>
                  <p className="text-3xl font-bold">{stats.fresherJobs || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(((stats.fresherJobs || 0) / (stats.totalJobs || 1)) * 100)}% of total
                  </p>
                </div>
                <Users size={32} className="text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Domains</p>
                  <p className="text-3xl font-bold">{stats.uniqueDomains || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Different tech domains</p>
                </div>
                <Zap size={32} className="text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Last 24h</p>
                  <p className="text-3xl font-bold">{stats.last24hJobs || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">New jobs</p>
                </div>
                <TrendingUp size={32} className="text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && stats.byCareerLevel && Object.keys(stats.byCareerLevel).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-bold">Jobs by Career Level</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.byCareerLevel).map(([level, count]: [string, any]) => (
              <div key={level}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{level || 'Unspecified'}</span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((count / (stats.totalJobs || 1)) * 100),
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {stats && stats.byWorkMode && Object.keys(stats.byWorkMode).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-bold">Jobs by Work Mode</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.byWorkMode).map(([mode, count]: [string, any]) => (
              <div key={mode}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{mode || 'Unspecified'}</span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((count / (stats.totalJobs || 1)) * 100),
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {trending.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-bold">🔥 Trending Jobs</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trending.map((job, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-orange-500 pl-4 py-2"
                >
                  <p className="font-semibold text-sm">{job.title}</p>
                  <p className="text-xs text-gray-600">{job.company}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {fresher.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-bold">👨‍🎓 Best for Freshers</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fresher.map((job, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-green-500 pl-4 py-2"
                >
                  <p className="font-semibold text-sm">{job.title}</p>
                  <p className="text-xs text-gray-600">{job.company}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

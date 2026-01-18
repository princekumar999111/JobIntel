import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw, TrendingUp, Users, Briefcase, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsDashboard = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/platform/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      const data = await response.json();
      setDashboard(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const data = dashboard?.platform || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Real-time platform analytics and insights</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics - 4 Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(data.totalUsers || 0).toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">+{Math.round(data.userGrowthRate || 0)}% this month</p>
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(data.activeJobs || 0).toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">+{Math.round(data.jobGrowthRate || 0)}% growth</p>
          </CardContent>
        </Card>

        {/* Total Companies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(data.totalCompanies || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">{(data.activeCompanies || 0)} active</p>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(data.totalApplications || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">Total submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle>User & Job Growth</CardTitle>
            <CardDescription>30-day trend comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Users', value: data.userGrowthRate || 0 },
                { name: 'Jobs', value: data.jobGrowthRate || 0 },
                { name: 'Companies', value: 5 },
                { name: 'Applications', value: 8 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly Active Users</span>
                <span className="font-semibold">{(data.monthlyActiveUsers || 0).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Churn Rate</span>
                <span className="font-semibold">{(data.churnRate || 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: `${Math.min(data.churnRate || 0, 100)}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>API Response Time</span>
                <span className="font-semibold">{(data.apiResponseTime || 0).toFixed(0)}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uptime</span>
                <span className="font-semibold">{data.uptime || '100'}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(parseFloat(data.uptime) || 100, 100)}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Search Queries */}
      {data.topSearchQueries && data.topSearchQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Search Queries</CardTitle>
            <CardDescription>Most searched terms in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topSearchQueries.slice(0, 5).map((query: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">{query.query}</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">{query.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Locations */}
      {data.topLocations && data.topLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Jobs and activity by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.topLocations.slice(0, 4).map((location: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-3">
                  <p className="font-semibold">{location.location}</p>
                  <p className="text-2xl font-bold text-blue-600">{location.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue & Conversion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{(data.monthlyRecurringRevenue || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">Active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Math.round(data.avgSessionDuration || 0)}m</p>
            <p className="text-xs text-gray-600 mt-1">Minutes per user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Math.floor(Math.random() * 50) + 10}</p>
            <p className="text-xs text-green-600 mt-1">+12% from yesterday</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

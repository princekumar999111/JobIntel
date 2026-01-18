import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingDown, TrendingUp, Activity, Smartphone, Clock, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UserEngagementAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserAnalytics();
  }, []);

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/platform/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch user analytics');
      const result = await response.json();
      setData(result);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Simulated engagement data for charts
  const engagementTrend = [
    { date: '1 Jan', engaged: 1200, views: 2400, applied: 240 },
    { date: '5 Jan', engaged: 1398, views: 2210, applied: 221 },
    { date: '10 Jan', engaged: 1800, views: 2290, applied: 229 },
    { date: '15 Jan', engaged: 2190, views: 2000, applied: 200 },
    { date: '20 Jan', engaged: 2500, views: 2181, applied: 500 },
    { date: '25 Jan', engaged: 2100, views: 2500, applied: 250 },
    { date: '30 Jan', engaged: 2800, views: 2100, applied: 210 }
  ];

  const activityLevelData = [
    { name: 'Highly Active', value: 3500, color: '#10b981' },
    { name: 'Active', value: 5200, color: '#3b82f6' },
    { name: 'Moderate', value: 4100, color: '#f59e0b' },
    { name: 'Low', value: 2200, color: '#ef4444' },
    { name: 'Inactive', value: 1000, color: '#9ca3af' }
  ];

  const deviceBreakdown = [
    { name: 'Mobile', value: 45, color: '#3b82f6' },
    { name: 'Desktop', value: 40, color: '#8b5cf6' },
    { name: 'Tablet', value: 15, color: '#ec4899' }
  ];

  const subscriptionData = [
    { name: 'Premium', users: 4500, engagement: 85 },
    { name: 'Standard', users: 7200, engagement: 65 },
    { name: 'Free', users: 9100, engagement: 40 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            User Engagement Analytics
          </h1>
          <p className="text-gray-600 mt-2">Track user behavior, engagement patterns, and activity metrics</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">7.4/10</p>
            <p className="text-xs text-green-600 mt-1">+0.3 points this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Daily Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12.5K</p>
            <p className="text-xs text-green-600 mt-1">+8% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Jobs Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">18.2K</p>
            <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">45%</p>
            <p className="text-xs text-gray-600 mt-1">Of total users</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Engagement Trend</CardTitle>
          <CardDescription>Active users, page views, and applications over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="engaged" stroke="#3b82f6" strokeWidth={2} name="Engaged Users" />
              <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} name="Page Views" />
              <Line type="monotone" dataKey="applied" stroke="#10b981" strokeWidth={2} name="Applications" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement vs Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement by Subscription Type</CardTitle>
          <CardDescription>User count and engagement score by plan</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="users" fill="#3b82f6" name="Users" />
              <Bar yAxisId="right" dataKey="engagement" fill="#10b981" name="Engagement %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity Distribution</CardTitle>
            <CardDescription>Users by activity level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={activityLevelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Platform usage by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Jobs Viewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">This Week</span>
                <span className="font-semibold">48.2K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">This Month</span>
                <span className="font-semibold">156.8K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg per User</span>
                <span className="font-semibold">12.4</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Application Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Views to Apply</span>
                <span className="font-semibold">11.6%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg per User</span>
                <span className="font-semibold">1.4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completion Rate</span>
                <span className="font-semibold">89.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">User Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Day 1 Retention</span>
                <span className="font-semibold text-green-600">92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Day 7 Retention</span>
                <span className="font-semibold text-blue-600">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Day 30 Retention</span>
                <span className="font-semibold text-orange-600">42%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Insights</CardTitle>
          <CardDescription>Key findings and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-2 bg-green-50 rounded">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Strong Mobile Growth</p>
              <p className="text-xs text-gray-600">Mobile users growing 15% month-over-month, now 45% of platform</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2 bg-blue-50 rounded">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Premium User Engagement</p>
              <p className="text-xs text-gray-600">Premium subscribers show 85% engagement vs 40% for free users</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2 bg-orange-50 rounded">
            <TrendingDown className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Retention Opportunity</p>
              <p className="text-xs text-gray-600">Day 7 retention at 68% - room for improvement with push notifications</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserEngagementAnalytics;

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface CompanyStats {
  totalCompanies: number;
  verifiedCompanies: number;
  pendingCompanies: number;
  rejectedCompanies: number;
  blacklistedCompanies: number;
  highPriorityCompanies: number;
  verificationRate: string;
  averageQualityScore: string;
}

export default function CompanyAnalytics() {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies/stats/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics</p>
        <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
      </div>
    );
  }

  // Prepare chart data
  const statusData = [
    { name: 'Verified', value: stats.verifiedCompanies, fill: '#10b981' },
    { name: 'Pending', value: stats.pendingCompanies, fill: '#f59e0b' },
    { name: 'Rejected', value: stats.rejectedCompanies, fill: '#ef4444' },
    { name: 'Blacklisted', value: stats.blacklistedCompanies, fill: '#6b7280' }
  ];

  const metricsData = [
    { name: 'Total', value: stats.totalCompanies },
    { name: 'Verified', value: stats.verifiedCompanies },
    { name: 'High Priority', value: stats.highPriorityCompanies },
    { name: 'Blacklisted', value: stats.blacklistedCompanies }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Company Analytics
          </h1>
          <p className="text-muted-foreground">Overview of company management metrics</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" className="gap-2">
          <Loader2 className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all statuses</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.verifiedCompanies}</div>
            <p className="text-xs text-green-700 mt-1">{stats.verificationRate}% verification rate</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingCompanies}</div>
            <p className="text-xs text-yellow-700 mt-1">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageQualityScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Data quality average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Company Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Metrics Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Key Metrics Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">Total Companies</span>
                <span className="font-bold">{stats.totalCompanies}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-sm font-medium">Verified Companies</span>
                <span className="font-bold text-green-600">{stats.verifiedCompanies}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <span className="text-sm font-medium">Pending Review</span>
                <span className="font-bold text-yellow-600">{stats.pendingCompanies}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                <span className="text-sm font-medium">Rejected Companies</span>
                <span className="font-bold text-red-600">{stats.rejectedCompanies}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">Blacklisted Companies</span>
                <span className="font-bold">{stats.blacklistedCompanies}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-sm font-medium">High Priority Companies</span>
                <span className="font-bold text-blue-600">{stats.highPriorityCompanies}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verification Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion</span>
                <span className="font-bold">{stats.verificationRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${parseFloat(stats.verificationRate)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quality Score</span>
                <span className="font-bold">{stats.averageQualityScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    parseFloat(stats.averageQualityScore) >= 75 ? 'bg-green-600' :
                    parseFloat(stats.averageQualityScore) >= 50 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${parseFloat(stats.averageQualityScore)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Building2, BarChart3, TrendingUp, Award, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CompanyPerformanceAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanyAnalytics();
  }, []);

  const fetchCompanyAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/platform/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch company analytics');
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

  // Simulated company performance data
  const companyPerformanceData = [
    { company: 'Tech Corp', profileViews: 5200, applications: 1240, hireRate: 85, avgResponse: 12 },
    { company: 'Finance Inc', profileViews: 4800, applications: 1050, hireRate: 78, avgResponse: 18 },
    { company: 'StartUp Labs', profileViews: 3500, applications: 892, hireRate: 72, avgResponse: 8 },
    { company: 'Enterprise Ltd', profileViews: 6100, applications: 1520, hireRate: 88, avgResponse: 24 },
    { company: 'Growth Ventures', profileViews: 2800, applications: 650, hireRate: 65, avgResponse: 15 }
  ];

  const conversionRateData = [
    { name: 'Profile View → Application', rate: 22 },
    { name: 'Application → Interview', rate: 35 },
    { name: 'Interview → Offer', rate: 18 },
    { name: 'Offer → Acceptance', rate: 87 }
  ];

  const topLocationsCompany = [
    { location: 'Bangalore', companies: 245, activeJobs: 1824 },
    { location: 'Mumbai', companies: 198, activeJobs: 1456 },
    { location: 'Delhi', companies: 167, activeJobs: 1123 },
    { location: 'Hyderabad', companies: 142, activeJobs: 987 },
    { location: 'Pune', companies: 118, activeJobs: 856 }
  ];

  const skillDemandData = [
    { skill: 'Python', demand: 2450, avg_salary: 85000 },
    { skill: 'React', demand: 2100, avg_salary: 78000 },
    { skill: 'Java', demand: 1950, avg_salary: 80000 },
    { skill: 'AWS', demand: 1680, avg_salary: 92000 },
    { skill: 'SQL', demand: 1560, avg_salary: 72000 }
  ];

  const qualityScoreDistribution = [
    { score: 'Excellent (90+)', companies: 45, color: '#10b981' },
    { score: 'Good (75-89)', companies: 156, color: '#3b82f6' },
    { score: 'Average (60-74)', companies: 198, color: '#f59e0b' },
    { score: 'Below Avg (< 60)', companies: 42, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Company Performance Analytics
          </h1>
          <p className="text-gray-600 mt-2">Hiring metrics, performance trends, and company insights</p>
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
              <Building2 className="h-4 w-4" />
              Active Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">641</p>
            <p className="text-xs text-green-600 mt-1">+12 companies this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Avg Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">7.2/10</p>
            <p className="text-xs text-gray-600 mt-1">Based on hiring quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">16.4h</p>
            <p className="text-xs text-green-600 mt-1">-2.1h from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Hire Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">78.6%</p>
            <p className="text-xs text-gray-600 mt-1">Profile to hire conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Top Companies Performance</CardTitle>
          <CardDescription>Company metrics: profile views, applications, and conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={companyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="company" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="profileViews" fill="#3b82f6" name="Profile Views" />
              <Bar yAxisId="right" dataKey="hireRate" fill="#10b981" name="Hire Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Hiring Conversion Funnel</CardTitle>
          <CardDescription>Drop-off rates at each hiring stage</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionRateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={200} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="rate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quality Score Distribution & Top Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Company Quality Scores</CardTitle>
            <CardDescription>Distribution of hiring quality ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={qualityScoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ score, companies }) => `${score}: ${companies}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="companies"
                >
                  {qualityScoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Hiring Locations</CardTitle>
            <CardDescription>Companies and jobs by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLocationsCompany.map((loc, idx) => (
                <div key={idx} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">{loc.location}</p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{loc.companies} companies</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Active Jobs</span>
                    <span className="font-semibold">{loc.activeJobs.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(loc.activeJobs / 20, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Skills in Demand */}
      <Card>
        <CardHeader>
          <CardTitle>Top Skills in Demand</CardTitle>
          <CardDescription>Most requested skills and average salary</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillDemandData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis yAxisId="left" label={{ value: 'Job Count', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg Salary (₹)', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="demand" fill="#3b82f6" name="Job Postings" />
              <Bar yAxisId="right" dataKey="avg_salary" fill="#10b981" name="Avg Salary (₹1000s)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Company Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Fastest Avg</span>
              <span className="font-semibold text-green-600">4.2h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Slowest Avg</span>
              <span className="font-semibold text-red-600">28.5h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Median</span>
              <span className="font-semibold">16.4h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Jobs Posted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">This Month</span>
              <span className="font-semibold">3,250</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Last Month</span>
              <span className="font-semibold">2,890</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Growth</span>
              <span className="font-semibold text-green-600">+12.4%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Hiring Success</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Positions Filled</span>
              <span className="font-semibold">1,456</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Success Rate</span>
              <span className="font-semibold text-green-600">82.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg Time-to-Hire</span>
              <span className="font-semibold">18d</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights & Recommendations</CardTitle>
          <CardDescription>Data-driven recommendations for hiring improvement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-green-50 rounded border-l-4 border-green-600">
            <p className="font-semibold text-sm text-green-900">Top Performer: Tech Corp</p>
            <p className="text-xs text-green-800 mt-1">85% hire rate with fastest average response time (12h)</p>
          </div>

          <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-600">
            <p className="font-semibold text-sm text-blue-900">Skill Gap Opportunity</p>
            <p className="text-xs text-blue-800 mt-1">42 additional AWS jobs posted vs available talent pool - upskilling initiative recommended</p>
          </div>

          <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-600">
            <p className="font-semibold text-sm text-orange-900">Response Time Improvement</p>
            <p className="text-xs text-orange-800 mt-1">Enterprise Ltd averaging 24h - automated response templates could reduce to 6h</p>
          </div>

          <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-600">
            <p className="font-semibold text-sm text-purple-900">Bangalore Growth</p>
            <p className="text-xs text-purple-800 mt-1">1,824 active jobs in Bangalore - highest demand pool with 245 active companies</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyPerformanceAnalytics;

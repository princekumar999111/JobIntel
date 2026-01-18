import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BarChart3, TrendingUp, Zap, Target, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const RecommendationInsights = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekFilter, setWeekFilter] = useState('4');
  const userId = localStorage.getItem('userId') || 'default';

  useEffect(() => {
    fetchInsights();
  }, [weekFilter]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recommendations/insights/${userId}?weeks=${weekFilter}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch insights');
      const data = await response.json();
      setInsights(data);
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

  // Sample funnel data
  const funnelData = [
    { stage: 'Received', count: insights?.recommendationsReceived || 50, color: '#3b82f6' },
    { stage: 'Viewed', count: insights?.recommendationsViewed || 35, color: '#8b5cf6' },
    { stage: 'Clicked', count: insights?.recommendationsClicked || 28, color: '#ec4899' },
    { stage: 'Applied', count: insights?.applicationsFromRecommendations || 8, color: '#10b981' }
  ];

  // Sample engagement data
  const engagementData = [
    { day: 'Mon', recommendations: 8, clicks: 4, applications: 1 },
    { day: 'Tue', recommendations: 9, clicks: 5, applications: 2 },
    { day: 'Wed', recommendations: 7, clicks: 3, applications: 0 },
    { day: 'Thu', recommendations: 10, clicks: 7, applications: 2 },
    { day: 'Fri', recommendations: 12, clicks: 9, applications: 3 },
    { day: 'Sat', recommendations: 6, clicks: 2, applications: 0 },
    { day: 'Sun', recommendations: 5, clicks: 1, applications: 0 }
  ];

  // Quality feedback data
  const feedbackData = [
    { name: 'Relevant', value: insights?.recommendationQualityFeedback?.relevant || 15, color: '#10b981' },
    { name: 'Neutral', value: insights?.recommendationQualityFeedback?.neutral || 8, color: '#f59e0b' },
    { name: 'Irrelevant', value: insights?.recommendationQualityFeedback?.irrelevant || 3, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          Recommendation Insights
        </h1>
        <p className="text-gray-600 mt-2">Analyze your recommendation engagement and performance</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {insights && (
        <>
          {/* Time Period Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Period</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              {['1', '2', '4', '8', '12'].map((weeks) => (
                <button
                  key={weeks}
                  onClick={() => setWeekFilter(weeks)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${weekFilter === weeks
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {weeks} weeks
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{insights.recommendationsReceived}</p>
                <p className="text-xs text-gray-600 mt-1">Total received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{Math.round(insights.clickThroughRate)}%</p>
                <p className="text-xs text-gray-600 mt-1">Click-through rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{insights.applicationsFromRecommendations}</p>
                <p className="text-xs text-gray-600 mt-1">Applications submitted</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold capitalize">{insights.userEngagement}</p>
                <p className="text-xs text-gray-600 mt-1">User engagement level</p>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">{Math.round(insights.conversionRate)}%</p>
                <p className="text-sm text-gray-600 mt-2">Recommendations → Applications</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${Math.round(insights.conversionRate)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Match Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">{insights.averageMatchScore}%</p>
                <p className="text-sm text-gray-600 mt-2">Recommendation quality</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${insights.averageMatchScore}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendation Funnel</CardTitle>
              <CardDescription>How recommendations convert through stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((stage, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{stage.stage}</span>
                      <span className="text-sm text-gray-600">{stage.count} ({Math.round((stage.count / funnelData[0].count) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden" style={{ width: `${(stage.count / funnelData[0].count) * 100}%` }}>
                      <div
                        className="h-full flex items-center justify-end px-2 text-white text-sm font-semibold"
                        style={{ backgroundColor: stage.color }}
                      >
                        {stage.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Engagement Trend</CardTitle>
              <CardDescription>Recommendations and interactions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="recommendations" stroke="#3b82f6" strokeWidth={2} name="Recommendations" />
                  <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} name="Clicks" />
                  <Line type="monotone" dataKey="applications" stroke="#10b981" strokeWidth={2} name="Applications" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quality Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommendation Quality Feedback</CardTitle>
                <CardDescription>User feedback on recommendation quality</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={feedbackData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {feedbackData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Matched Skills</CardTitle>
                <CardDescription>Skills most commonly matched in recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { skill: 'JavaScript', matches: 18 },
                  { skill: 'React', matches: 15 },
                  { skill: 'Python', matches: 12 },
                  { skill: 'TypeScript', matches: 11 },
                  { skill: 'Node.js', matches: 9 }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{item.skill}</span>
                    <Badge variant="secondary">{item.matches}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Suggested Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Recommended Actions
              </CardTitle>
              <CardDescription>Optimize your recommendation experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.suggestedActions?.map((action: string, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <p className="text-sm">{action}</p>
                </div>
              )) || (
                <>
                  <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                    <p className="text-sm">✓ You have high engagement! Continue with current preferences</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                    <p className="text-sm">💡 Try updating your preferences to see more diverse recommendations</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                    <p className="text-sm">📊 Enable notifications for timely recommendations</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Engine Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Engine Performance
              </CardTitle>
              <CardDescription>Recommendation engine health and optimization</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">87%</p>
                <p className="text-xs text-gray-600 mt-1">Match Accuracy</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">42ms</p>
                <p className="text-xs text-gray-600 mt-1">Response Time</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-purple-600">2.4M</p>
                <p className="text-xs text-gray-600 mt-1">Models Trained</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-orange-600">99.9%</p>
                <p className="text-xs text-gray-600 mt-1">Uptime</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default RecommendationInsights;

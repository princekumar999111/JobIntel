import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, AlertCircle } from 'lucide-react';

interface MatchedJob {
  _id: string;
  title: string;
  company: string;
  matchScore: number;
  source: 'admin' | 'scraping';
}

export default function MatchedJobsWidget() {
  const { token } = useAuthStore();
  const [jobs, setJobs] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchMatchedJobs();
    }
  }, [token]);

  const fetchMatchedJobs = async () => {
    try {
      setLoading(true);
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/resume/matching-jobs?limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch matched jobs');

      const data = await response.json();
      // Backend returns 'matches', not 'jobs'
      const matchedJobs = data.matches || [];
      // Transform to include source field and take first 5
      const jobsWithSource = matchedJobs.slice(0, 5).map((job: any) => ({
        title: job.title,
        company: job.company,
        matchScore: job.matchScore,
        _id: job.jobId,
        source: 'admin',
      }));
      setJobs(jobsWithSource);
      setError(null);
    } catch (err) {
      console.error(err);
      // Don't show error for widget, just show empty state
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Top Matched Jobs
            </CardTitle>
            <CardDescription>Jobs matched based on your resume and skills</CardDescription>
          </div>
          <Link to="/dashboard/matched-jobs">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-muted-foreground">Loading matched jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              No matched jobs yet. <br />
              Upload your resume to get personalized recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getScoreColor(job.matchScore)}
                  >
                    {job.matchScore}%
                  </Badge>
                  {job.source === 'scraping' && (
                    <Badge variant="secondary" className="text-xs">
                      Scraped
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            <Link to="/dashboard/matched-jobs" className="block mt-4">
              <Button className="w-full" variant="outline">
                View All Matched Jobs
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

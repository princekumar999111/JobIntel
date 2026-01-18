import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Briefcase, DollarSign, Zap, Filter, AlertCircle } from 'lucide-react';

interface MatchedJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  matchScore: number;
  matchedSkills: string[];
  source: 'admin' | 'scraping';
  description: string;
  requiredSkills: string[];
}

export default function MatchedJobs() {
  const { user, token } = useAuthStore();
  const [jobs, setJobs] = useState<MatchedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'admin' | 'scraping'>('all');
  const [minScore, setMinScore] = useState(70);

  useEffect(() => {
    fetchMatchedJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, filterSource, minScore]);

  const fetchMatchedJobs = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      // Fetch personalized matching jobs from resume
      const response = await fetch('/api/resume/matching-jobs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch matched jobs (${response.status})`);
      }

      const data = await response.json();
      console.log('Matched jobs data:', data);
      
      // Backend returns 'matches', not 'jobs'
      const matchedJobs = data.matches || [];
      // Transform to include source field
      const jobsWithSource = matchedJobs.map((job: any) => ({
        ...job,
        _id: job.jobId,
        source: 'admin',
      }));
      setJobs(jobsWithSource);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load matched jobs';
      setError(errorMsg);
      console.error('Error fetching matched jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs.filter(
      (job) =>
        job.matchScore >= minScore &&
        (filterSource === 'all' || job.source === filterSource) &&
        (searchTerm === '' ||
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredJobs(filtered);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getSourceBadge = (source: string) => {
    return source === 'admin' ? (
      <Badge variant="default">Admin Posted</Badge>
    ) : (
      <Badge variant="secondary">Scraped</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Matched Jobs</h1>
        <p className="text-muted-foreground mt-2">
          Based on your resume, skills, and profile tags
        </p>
      </div>

      {/* Resume Status Alert */}
      {!user?.resume && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Upload your resume to get better matches</p>
              <p className="text-sm text-yellow-800">
                Personalized job matching works best with an uploaded resume.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Search by title, company, location</label>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Source</label>
              <Select value={filterSource} onValueChange={(v: any) => setFilterSource(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="admin">Admin Posted</SelectItem>
                  <SelectItem value="scraping">Scraped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Minimum Match Score</label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{minScore}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Found <span className="font-bold text-foreground">{filteredJobs.length}</span> matching jobs
          </p>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Loading matched jobs...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {jobs.length === 0
                  ? 'No matched jobs yet. Try uploading your resume.'
                  : 'No jobs match your current filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Job Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSourceBadge(job.source)}
                      </div>
                    </div>

                    {/* Match Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{job.location}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>{job.matchScore}% match</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{job.matchedSkills.length} skills matched</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Your skills:</span>
                      {job.matchedSkills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.matchedSkills.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.matchedSkills.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Match Score Indicator */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`h-16 w-16 rounded-full ${getScoreColor(
                        job.matchScore
                      )} flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {job.matchScore}%
                    </div>
                    <Button className="w-full">View & Apply</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Company {
  _id: string;
  name: string;
  website?: string;
  industry?: string;
  status: 'pending' | 'verified' | 'rejected' | 'suspended';
  verificationStatus: 'not_verified' | 'in_review' | 'verified' | 'rejected';
  dataQualityScore: number;
  jobsPosted: number;
  jobsScraped: number;
  blacklistedFromScraping: boolean;
  scraperPriority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/companies?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setCompanies(data.data);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || variants.pending;
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_review':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground">Manage job source companies</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {companies.filter(c => c.verificationStatus === 'verified').length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-yellow-600">
              {companies.filter(c => c.status === 'pending').length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blacklisted</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-red-600">
              {companies.filter(c => c.blacklistedFromScraping).length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="gap-2"
                prefix={<Search className="h-4 w-4" />}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Quality Score</TableHead>
              <TableHead>Jobs Posted</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company._id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{company.industry || '—'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(company.status)}>
                      {company.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getVerificationBadge(company.verificationStatus)}
                      <span className="text-sm">{company.verificationStatus}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      company.dataQualityScore >= 75 ? 'text-green-600' :
                      company.dataQualityScore >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {company.dataQualityScore}%
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{company.jobsPosted}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {company.scraperPriority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Handle delete
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

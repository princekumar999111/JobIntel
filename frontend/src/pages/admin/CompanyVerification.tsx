import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PendingCompany {
  _id: string;
  name: string;
  website?: string;
  careerPage?: string;
  industry?: string;
  companySize?: string;
  contactEmail?: string;
  contactPhone?: string;
  tags?: string[];
  createdAt: string;
}

export default function CompanyVerification() {
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<PendingCompany | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchPendingCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies?status=pending&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setCompanies(data.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const handleVerify = async (companyId: string, approved: boolean) => {
    if (!approved && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setVerifying(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${companyId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved,
          rejectionReason: approved ? undefined : rejectionReason
        })
      });

      if (!response.ok) throw new Error('Failed to verify');

      // Remove from list
      setCompanies(companies.filter(c => c._id !== companyId));
      setSelectedCompany(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error verifying company:', error);
      alert('Failed to verify company');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Company Verification</h1>
          <p className="text-muted-foreground">Review and verify pending companies</p>
        </div>
        <Button onClick={fetchPendingCompanies} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Pending Count */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-yellow-800">
            <span className="font-semibold">{companies.length}</span> companies pending verification
          </p>
        </CardContent>
      </Card>

      {/* Companies List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : companies.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-semibold">All caught up!</p>
              <p className="text-muted-foreground">No pending companies to verify</p>
            </CardContent>
          </Card>
        ) : (
          companies.map((company) => (
            <Card key={company._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{company.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {company.industry} • {company.companySize}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Company Details */}
                <div className="grid gap-3 text-sm">
                  {company.website && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Website:</span>
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                        {company.website}
                      </a>
                    </div>
                  )}
                  {company.careerPage && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Career Page:</span>
                      <a href={company.careerPage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                        {company.careerPage}
                      </a>
                    </div>
                  )}
                  {company.contactEmail && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Contact Email:</span>
                      <span className="ml-2">{company.contactEmail}</span>
                    </div>
                  )}
                  {company.contactPhone && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Contact Phone:</span>
                      <span className="ml-2">{company.contactPhone}</span>
                    </div>
                  )}
                  {company.tags && company.tags.length > 0 && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Tags:</span>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {company.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleVerify(company._id, true)}
                    disabled={verifying}
                    className="flex-1 gap-2"
                    variant="default"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => setSelectedCompany(company)}
                    disabled={verifying}
                    className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50"
                    variant="outline"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={(open) => {
        if (!open) {
          setSelectedCompany(null);
          setRejectionReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Company</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason (required)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-24"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCompany(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedCompany && handleVerify(selectedCompany._id, false)}
                disabled={!rejectionReason.trim() || verifying}
                className="flex-1"
              >
                {verifying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Reject Company
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

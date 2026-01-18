import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Loader2, AlertCircle } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AdminRole {
  _id: string;
  name: string;
  description: string;
  tier: number;
  permissions: string[];
  canManageRoles: boolean;
  canManageAdmins: boolean;
  canEditSettings: boolean;
  canViewAudit: boolean;
  canDeleteAudit: boolean;
  createdAt: string;
  updatedAt: string;
}

const tierColors: Record<number, string> = {
  0: 'bg-red-100 text-red-800',
  1: 'bg-orange-100 text-orange-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-green-100 text-green-800',
};

const tierLabels: Record<number, string> = {
  0: 'Super Admin',
  1: 'Admin',
  2: 'Scraper Admin',
  3: 'Analyst',
};

export default function AdminRoleManagement() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/roles', {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.statusText}`);
      }

      const data = await response.json();
      setRoles(data.data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (role: AdminRole) => {
    setSelectedRole(role);
    setShowDetails(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete role');
      }

      setRoles(roles.filter((r) => r._id !== roleId));
      alert('Role deleted successfully');
    } catch (err) {
      console.error('Error deleting role:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Role Management
          </h1>
          <p className="text-muted-foreground">Manage admin roles and permissions</p>
        </div>
        <Button onClick={() => setShowNewRole(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Role
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Roles Table */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Roles ({filteredRoles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Capabilities</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={tierColors[role.tier]}>
                          {tierLabels[role.tier]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{role.permissions.length} permissions</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.canManageRoles && (
                            <Badge variant="secondary" className="text-xs">
                              Manage Roles
                            </Badge>
                          )}
                          {role.canManageAdmins && (
                            <Badge variant="secondary" className="text-xs">
                              Manage Admins
                            </Badge>
                          )}
                          {role.canEditSettings && (
                            <Badge variant="secondary" className="text-xs">
                              Edit Settings
                            </Badge>
                          )}
                          {role.canViewAudit && (
                            <Badge variant="secondary" className="text-xs">
                              View Audit
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(role)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteRole(role._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredRoles.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No roles found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Role Details Dialog */}
      {selectedRole && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRole.name}</DialogTitle>
              <DialogDescription>{selectedRole.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Role Tier</h3>
                <Badge className={tierColors[selectedRole.tier]}>
                  {tierLabels[selectedRole.tier]} (Tier {selectedRole.tier})
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Permissions ({selectedRole.permissions.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRole.permissions.map((perm) => (
                    <Badge key={perm} variant="outline">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Special Capabilities</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    {selectedRole.canManageRoles ? '✓' : '✗'} Can Manage Roles
                  </li>
                  <li className="flex items-center gap-2">
                    {selectedRole.canManageAdmins ? '✓' : '✗'} Can Manage Admins
                  </li>
                  <li className="flex items-center gap-2">
                    {selectedRole.canEditSettings ? '✓' : '✗'} Can Edit Settings
                  </li>
                  <li className="flex items-center gap-2">
                    {selectedRole.canViewAudit ? '✓' : '✗'} Can View Audit Logs
                  </li>
                  <li className="flex items-center gap-2">
                    {selectedRole.canDeleteAudit ? '✓' : '✗'} Can Delete Audit Logs
                  </li>
                </ul>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Created: {new Date(selectedRole.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedRole.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              <Button onClick={() => setShowDetails(false)}>Edit Role</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Users, Loader2, AlertCircle, Filter } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  _id: string;
  email: string;
  name: string;
  roles: string[];
  adminRole?: {
    _id: string;
    name: string;
    tier: number;
    description: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminRole {
  _id: string;
  name: string;
  tier: number;
  description: string;
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

export default function AdminUsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const [usersRes, rolesRes] = await Promise.all([
        fetch(`/api/admin/users-list?page=${currentPage}&limit=${pageSize}&${roleFilter ? `role=${roleFilter}` : ''}`, {
          headers,
        }),
        fetch('/api/admin/roles', {
          headers,
        }),
      ]);

      if (!usersRes.ok || !rolesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();

      setUsers(usersData.data || []);
      setRoles(rolesData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, roleFilter]);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    try {
      setAssigning(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          roleId: selectedRoleId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign role');
      }

      alert('Role assigned successfully');
      setShowAssignDialog(false);
      setSelectedRoleId('');
      fetchData();
    } catch (err) {
      console.error('Error assigning role:', err);
      alert(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (userId: string) => {
    if (!window.confirm('Remove admin role from this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users/remove-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove role');
      }

      alert('Role removed successfully');
      fetchData();
    } catch (err) {
      console.error('Error removing role:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove role');
    }
  };

  const handleOpenAssignDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleId('');
    setShowAssignDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">Assign and manage admin roles for users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Users</SelectItem>
              <SelectItem value="admin">Has Admin Role</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role._id} value={role._id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Users Table */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Admin Role</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id} className="hover:bg-muted/50">
                      <TableCell>
                        <p className="font-medium">{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <p>{user.name || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        {user.adminRole ? (
                          <Badge className={tierColors[user.adminRole.tier]}>
                            {tierLabels[user.adminRole.tier]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No role</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssignDialog(user)}
                          >
                            <Plus className="h-4 w-4" />
                            Assign Role
                          </Button>
                          {user.adminRole && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveRole(user._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign Role Dialog */}
      {selectedUser && (
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Admin Role</DialogTitle>
              <DialogDescription>
                Assign an admin role to {selectedUser.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Role</label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        <div className="flex items-center gap-2">
                          <Badge className={tierColors[role.tier]}>
                            {tierLabels[role.tier]}
                          </Badge>
                          <span>{role.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    {
                      roles.find((r) => r._id === selectedRoleId)?.description ||
                      'Role selected'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAssignDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignRole}
                disabled={!selectedRoleId || assigning}
              >
                {assigning ? 'Assigning...' : 'Assign Role'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

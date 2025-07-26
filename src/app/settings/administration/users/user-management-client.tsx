'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { Badge } from '~/components/ui/badge';
import { Trash2, Plus, UserCheck, UserX, Eye, EyeOff } from 'lucide-react';
import { authClient } from '~/lib/auth-client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  twoFactorEnabled?: boolean;
  banned: boolean;
  createdAt: string;
  updatedAt: string;
}

export function UserManagementClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin'
  });

  const fetchUsers = async () => {
    try {
      const response = await authClient.admin.listUsers({
        query: {}
      });
      if (response.data) {
        const usersData = response.data.users || [];
        setUsers(usersData.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: (user.role ?? 'user') as 'user' | 'admin',
          twoFactorEnabled: false,
          banned: user.banned ?? false,
          createdAt: user.createdAt.toString(),
          updatedAt: user.updatedAt.toString()
        })));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await authClient.admin.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });

      if (response.data) {
        toast.success('User created successfully');
        setCreateDialogOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'user' as 'user' | 'admin' });
        await fetchUsers();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await authClient.admin.removeUser({ userId });
      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  const handleBanUser = async (userId: string, shouldBan: boolean) => {
    try {
      if (shouldBan) {
        await authClient.admin.banUser({ userId });
        toast.success('User banned successfully');
      } else {
        await authClient.admin.unbanUser({ userId });
        toast.success('User unbanned successfully');  
      }
      await fetchUsers();
    } catch (error) {
      console.error('Failed to update user ban status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user ban status';
      toast.error(errorMessage);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await authClient.admin.setRole({ userId, role: newRole });
      toast.success('User role updated successfully');
      await fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user role';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account with email and password
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: 'user' | 'admin') => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Total Users: {users.length}
        </div>
        
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{user.name}</h3>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    {user.banned && <Badge variant="destructive">Banned</Badge>}
                    {user.twoFactorEnabled && (
                      <Badge variant="outline" className="text-xs">2FA</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(newRole: 'user' | 'admin') => handleRoleChange(user.id, newRole)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBanUser(user.id, !user.banned)}
                  >
                    {user.banned ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Unban
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Ban
                      </>
                    )}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {user.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {users.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
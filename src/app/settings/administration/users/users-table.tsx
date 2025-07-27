'use client';

import { useState, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Label } from '~/components/ui/label';
import {
  ArrowUpDown,
  ChevronDown,
  Copy,
  MoreHorizontal,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
} from 'lucide-react';

import { authClient } from '~/lib/auth-client';
import { adminNotifications } from '~/lib/toast-utils';
import { UsersTableSkeleton } from './users-table-skeleton';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  banned: boolean;
  twoFactorEnabled: boolean;
  hasOAuth: boolean;
  oauthProviders: string[];
  createdAt: string;
  updatedAt: string;
  lastSeen: string | null;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center space-x-2">
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const role = row.getValue('role');
      return (
        <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
          {String(role)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center space-x-1">
          {user.banned && <Badge variant="destructive">Banned</Badge>}
          {user.twoFactorEnabled && (
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              2FA
            </Badge>
          )}
          {user.hasOAuth && (
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              OAuth
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(String(row.getValue('createdAt')));
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: 'lastSeen',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Last Seen
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const lastSeen = row.getValue('lastSeen');
      if (!lastSeen || typeof lastSeen !== 'string') return <span className="text-muted-foreground">Never</span>;
      
      const date = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 1) return <span>Just now</span>;
      if (diffMinutes < 60) return <span>{diffMinutes}m ago</span>;
      if (diffHours < 24) return <span>{diffHours}h ago</span>;
      if (diffDays < 7) return <span>{diffDays}d ago</span>;
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const user = row.original;
      // Get the refresh function from the table's meta data
      const refreshUsers = (table.options.meta as { refreshUsers?: () => Promise<void> } | undefined)?.refreshUsers;

      return <UserActionsDropdown user={user} onRefresh={refreshUsers} />;
    },
  },
];

interface UserActionsDropdownProps {
  user: User;
  onRefresh?: () => Promise<void>;
}

function UserActionsDropdown({ user, onRefresh }: UserActionsDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleRoleChange = async (newRole: 'user' | 'admin') => {
    const roleChangePromise = authClient.admin.setRole({ userId: user.id, role: newRole }).then(async (result) => {
      if (result?.error) {
        throw new Error(result.error.message ?? 'Failed to update role');
      }
      await onRefresh?.();
      adminNotifications.users.roleChanged(user.email, newRole);
      return result;
    });

    adminNotifications.users.loading.roleChange(roleChangePromise);
  };

  const handleBanUser = async (shouldBan: boolean) => {
    const banPromise = (shouldBan 
      ? authClient.admin.banUser({ userId: user.id })
      : authClient.admin.unbanUser({ userId: user.id })
    ).then(async (result) => {
      if (result?.error) {
        throw new Error(result.error.message ?? 'Failed to update ban status');
      }
      await onRefresh?.();
      if (shouldBan) {
        adminNotifications.users.banned(user.email);
      } else {
        adminNotifications.users.unbanned(user.email);
      }
      return result;
    });

    adminNotifications.users.loading.ban(banPromise);
  };

  const handleDeleteUser = async () => {
    const deletePromise = authClient.admin.removeUser({ userId: user.id }).then(async (result) => {
      if (result?.error) {
        throw new Error(result.error.message ?? 'Failed to delete user');
      }
      await onRefresh?.();
      adminNotifications.users.deleted(user.email);
      return result;
    });

    adminNotifications.users.loading.delete(deletePromise);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        
        <DropdownMenuItem
          onClick={() => handleRoleChange(user.role === 'admin' ? 'user' : 'admin')}
        >
          {user.role === 'admin' ? (
            <UserCheck className="mr-2 h-4 w-4" />
          ) : (
            <ShieldCheck className="mr-2 h-4 w-4" />
          )}
          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleBanUser(!user.banned)}
        >
          {user.banned ? (
            <UserCheck className="mr-2 h-4 w-4" />
          ) : (
            <UserX className="mr-2 h-4 w-4" />
          )}
          {user.banned ? 'Unban User' : 'Ban User'}
        </DropdownMenuItem>

        {user.twoFactorEnabled && (
          <DropdownMenuItem>
            <Shield className="mr-2 h-4 w-4" />
            Remove 2FA
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete user
            </DropdownMenuItem>
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
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersTable() {
  const [data, setData] = useState<User[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [loading, setLoading] = useState(true);

  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin'
  });
  const [generatedCredentials, setGeneratedCredentials] = useState({
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
        
        // Enhance user data with proper 2FA detection, OAuth detection, and Last Seen
        const enhancedUsers = await Promise.all(usersData.map(async (user) => {
          // Check if user has OAuth accounts by looking for password field
          // If user has no password but has an account, they likely use OAuth
          const hasPassword = Boolean((user as { password?: string }).password);
          const hasOAuth = !hasPassword && user.emailVerified;
          
          // Get the user's most recent session for Last Seen
          // Since listUserSessions doesn't seem to work, use a simpler approach
          // For now, use the user's updatedAt as a proxy for last seen
          // This will show when the user record was last updated, which often corresponds to login activity
          let lastSeen: string | null = null;
          
          // Try to get actual session data, but fall back to updatedAt if not available
          try {
            // First try the admin method
            const sessionsResponse = await authClient.admin.listUserSessions({
              userId: user.id
            });
            
            if (sessionsResponse?.data && Array.isArray(sessionsResponse.data) && sessionsResponse.data.length > 0) {
              // Get the most recent session
              const sessions = sessionsResponse.data as Array<{ updatedAt: string }>;
              const mostRecentSession = sessions.reduce((latest, session) => {
                const sessionDate = new Date(session.updatedAt);
                const latestDate = new Date(latest.updatedAt);
                return sessionDate > latestDate ? session : latest;
              });
              
              lastSeen = mostRecentSession.updatedAt.toString();
            }
          } catch {
            // listUserSessions not available - silently continue
          }
          
          // If no session data, use user's updatedAt as proxy for activity
          if (!lastSeen) {
            // Only set lastSeen if the user has logged in (updatedAt is different from createdAt)
            const created = new Date(user.createdAt);
            const updated = new Date(user.updatedAt);
            
            if (updated.getTime() > created.getTime()) {
              lastSeen = user.updatedAt.toString();
            }
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: (user.role ?? 'user') as 'user' | 'admin',
            banned: user.banned ?? false,
            twoFactorEnabled: Boolean((user as { twoFactorEnabled?: boolean }).twoFactorEnabled),
            hasOAuth,
            oauthProviders: hasOAuth ? ['oauth'] : [], // Generic OAuth indicator
            createdAt: user.createdAt.toString(),
            updatedAt: user.updatedAt.toString(),
            lastSeen
          };
        }));
        
        setData(enhancedUsers);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users';
      adminNotifications.users.error(message);
    } finally {
      setLoading(false);
    }
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      refreshUsers: fetchUsers,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  useEffect(() => {
    void fetchUsers();
  }, []);

  // Generate a secure password
  const generateSecurePassword = () => {
    const length = 12;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      adminNotifications.users.error('Please fill in all required fields');
      return;
    }

    try {
      // Generate a secure password
      const generatedPassword = generateSecurePassword();

      const response = await authClient.admin.createUser({
        name: newUser.name,
        email: newUser.email,
        password: generatedPassword,
        role: newUser.role
      });

      if (response.data) {
        // Store credentials for the second dialog
        setGeneratedCredentials({
          email: newUser.email,
          password: generatedPassword,
          role: newUser.role
        });
        
        // Close create dialog and open credentials dialog
        setCreateDialogOpen(false);
        setCredentialsDialogOpen(true);
        
        // Reset form
        setNewUser({ name: '', email: '', role: 'user' as 'user' | 'admin' });
        
        // Refresh user list
        await fetchUsers();
        
        adminNotifications.users.created(newUser.email);
      } else if (response.error) {
        // Handle specific error cases
        if (response.error.message?.includes('already exists') || response.error.message?.includes('duplicate') || response.error.message?.includes('unique')) {
          adminNotifications.users.error('A user with this email already exists');
        } else {
          adminNotifications.users.error(response.error.message ?? 'Failed to create user');
        }
      } else {
        // Fallback for when there's no data and no error (shouldn't happen)
        adminNotifications.users.error('Failed to create user - no response from server');
      }
    } catch (error) {
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate') || error.message.includes('unique')) {
          adminNotifications.users.error('A user with this email already exists');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          adminNotifications.users.error('Network error - please check your connection');
        } else {
          adminNotifications.users.error(error.message);
        }
      } else {
        adminNotifications.users.error('Failed to create user - unknown error');
      }
    }
  };

  if (loading) {
    return <UsersTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Filter users..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center space-x-2">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. A secure password will be generated automatically.
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
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setNewUser({ name: '', email: '', role: 'user' as 'user' | 'admin' });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={!newUser.name.trim() || !newUser.email.trim()}
                >
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Credentials Dialog */}
          <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>User Created Successfully</DialogTitle>
                <DialogDescription>
                  Save these credentials - the password will not be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Invitation Message</Label>
                  <div className="relative">
                    <textarea
                      value={`You have been invited to TraffBoard!

Login credentials:
Email: ${generatedCredentials.email}
Password: ${generatedCredentials.password}

Login at: ${window.location.origin}/login

Your role: ${generatedCredentials.role.charAt(0).toUpperCase() + generatedCredentials.role.slice(1)}`}
                      readOnly
                      className="w-full h-32 p-3 text-sm bg-muted border rounded-md font-mono resize-none"
                    />
                  </div>
                </div>
                
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    const invitation = `You have been invited to TraffBoard!

Login credentials:
Email: ${generatedCredentials.email}
Password: ${generatedCredentials.password}

Login at: ${window.location.origin}/login

Your role: ${generatedCredentials.role.charAt(0).toUpperCase() + generatedCredentials.role.slice(1)}`;
                    
                    void navigator.clipboard.writeText(invitation);
                    adminNotifications.users.created(generatedCredentials.email);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data.length >= 10 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-6 lg:space-x-8 ml-auto">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
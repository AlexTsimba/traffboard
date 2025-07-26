'use client';

import { SignedIn, SignedOut } from '@daveyplate/better-auth-ui';
import { User, LogOut, Settings, Shield, Palette, Users, Database } from 'lucide-react';
import Link from 'next/link';
import { authClient } from '~/lib/auth-client';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '~/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/ui/avatar';

export function AuthNavUser() {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = '/login';
          }
        }
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Don't force redirect on error - let user see the issue
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SignedIn>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={session?.user?.image ?? ''} alt={session?.user?.name ?? ''} />
                  <AvatarFallback className="rounded-lg">
                    {session?.user?.name?.[0] ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {session?.user?.name ?? 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.user?.email ?? ''}
                    </span>
                  </div>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/user/account" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/user/security" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Security
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/user/preferences" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Preferences
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              {session?.user?.role === 'admin' && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Administration
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                      <Link href="/settings/admin/users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Management
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings/admin/data" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Data Management
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SignedIn>

        <SignedOut>
          <SidebarMenuButton asChild size="lg">
            <Link href="/login">
              <User className="h-8 w-8 rounded-lg bg-muted p-1" />
              {!isCollapsed && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Sign In</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Access your account
                  </span>
                </div>
              )}
            </Link>
          </SidebarMenuButton>
        </SignedOut>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
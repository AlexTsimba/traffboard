'use client';

import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Monitor, Smartphone, Tablet, Globe, Trash2 } from 'lucide-react';

interface Session {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  updatedAt: Date;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  token: string;
}

interface ActiveSessionsProps {
  sessions: Session[];
  sessionsLoading: boolean;
  revokeLoading: string;
  currentSessionId?: string;
  onRevokeSession: (sessionToken: string) => void;
  onRevokeAllOtherSessions: () => void;
}

export function ActiveSessions({ 
  sessions, 
  sessionsLoading, 
  revokeLoading, 
  currentSessionId,
  onRevokeSession,
  onRevokeAllOtherSessions 
}: ActiveSessionsProps) {
  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getBrowserName = (userAgent?: string | null): string => {
    if (!userAgent) return 'Unknown Browser';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('edg/')) return 'Edge';
    if (ua.includes('chrome/') && ua.includes('safari/')) return 'Chrome';
    if (ua.includes('firefox/')) return 'Firefox';
    if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
    if (ua.includes('opera/') || ua.includes('opr/')) return 'Opera';
    if (ua.includes('brave/')) return 'Brave';
    
    const parts = userAgent.split(' ');
    for (const part of parts) {
      if (part.includes('/') && !part.startsWith('Mozilla/')) {
        return part.split('/')[0] ?? 'Unknown Browser';
      }
    }
    
    return 'Unknown Browser';
  };

  const formatLastActive = (date: Date | string) => {
    const now = new Date();
    const sessionDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div className="font-medium">
              Sessions • {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={onRevokeAllOtherSessions}
            disabled={sessionsLoading || sessions.length <= 1}
            size="sm"
          >
            {sessionsLoading ? 'Revoking...' : 'Sign Out Others'}
          </Button>
        </div>


        {sessionsLoading ? (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">Loading sessions...</div>
          </div>
        ) : (
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {sessions.map((sessionItem) => (
              <div key={sessionItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(sessionItem.userAgent ?? undefined)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {getBrowserName(sessionItem.userAgent ?? undefined)}
                      </span>
                      {sessionItem.id === currentSessionId && (
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sessionItem.ipAddress && (
                        <span>{sessionItem.ipAddress} • </span>
                      )}
                      Last active {formatLastActive(sessionItem.updatedAt)}
                    </div>
                  </div>
                </div>
                
                {sessionItem.id !== currentSessionId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRevokeSession(sessionItem.id)}
                    disabled={revokeLoading === sessionItem.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {revokeLoading === sessionItem.id ? (
                      'Revoking...'
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
            
            {sessions.length === 0 && (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">No active sessions found</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
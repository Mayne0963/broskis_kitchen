/**
 * Example React Component: Safe User List
 * 
 * This component demonstrates how to use the Firestore safety wrapper
 * in React components to handle index building gracefully.
 */

"use client";

import React, { useState, useEffect } from 'react';
import { getUsersByRoleSafe, handleUserServiceResponse, UserProfile } from '@/lib/services/userServiceSafe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SafeUserListProps {
  role: "admin" | "user";
  title?: string;
  limit?: number;
}

export const SafeUserList: React.FC<SafeUserListProps> = ({ 
  role, 
  title = `${role.charAt(0).toUpperCase() + role.slice(1)} Users`,
  limit = 50 
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [indexMessage, setIndexMessage] = useState<string>("");
  const [retryAfter, setRetryAfter] = useState<number | undefined>();
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const loadUsers = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(false);
    setIndexBuilding(false);

    try {
      const response = await getUsersByRoleSafe(role, limit);
      
      handleUserServiceResponse(
        response,
        // onSuccess
        (data) => {
          setUsers(data.users);
          setHasMore(data.hasMore);
          setRetryCount(0); // Reset retry count on success
        },
        // onIndexBuilding
        (message, retryAfterMs) => {
          setIndexBuilding(true);
          setIndexMessage(message);
          setRetryAfter(retryAfterMs);
          
          // Auto-retry after the suggested time
          if (retryAfterMs && retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              loadUsers(false);
            }, Math.min(retryAfterMs, 300000)); // Max 5 minutes
          }
        },
        // onError
        () => {
          setError(true);
        }
      );
    } catch (err) {
      console.error("Error loading users:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [role, limit]);

  const formatRetryTime = (ms?: number) => {
    if (!ms) return "";
    const minutes = Math.ceil(ms / 60000);
    return `~${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const renderIndexBuildingState = () => (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Database Optimization in Progress</p>
            <p className="text-sm text-muted-foreground mt-1">
              {indexMessage}
              {retryAfter && (
                <span className="block mt-1">
                  Estimated completion: {formatRetryTime(retryAfter)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {retryCount > 0 && (
              <Badge variant="secondary">
                Retry {retryCount}/3
              </Badge>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );

  const renderErrorState = () => (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Unable to Load Users</p>
            <p className="text-sm mt-1">
              There was an error loading the user list. Please try again.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadUsers()}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );

  const renderUserCard = (user: UserProfile) => (
    <Card key={user.uid} className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{user.displayName || user.email}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.createdAt && (
                <p className="text-xs text-muted-foreground">
                  Joined {user.createdAt.toDate().toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
            {user.plan && (
              <Badge variant="outline">
                {user.plan}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center space-x-2">
              {!indexBuilding && !error && (
                <Badge variant="outline">
                  {users.length} user{users.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadUsers()}
                disabled={loading || indexBuilding}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Index Building State */}
          {indexBuilding && renderIndexBuildingState()}
          
          {/* Error State */}
          {error && renderErrorState()}
          
          {/* Loading State */}
          {loading && !indexBuilding && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading {role} users...</span>
            </div>
          )}
          
          {/* Users List */}
          {!loading && !error && !indexBuilding && (
            <>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {role} users found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(renderUserCard)}
                  
                  {hasMore && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          // Implement pagination logic here
                          console.log("Load more users...");
                        }}
                      >
                        Load More Users
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Index Building with Partial Data */}
          {indexBuilding && users.length > 0 && (
            <div className="space-y-3 opacity-75">
              <p className="text-sm text-muted-foreground mb-3">
                Showing cached results while database optimizes:
              </p>
              {users.map(renderUserCard)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SafeUserList;
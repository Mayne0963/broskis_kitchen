'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Server,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SystemMetrics {
  timestamp: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  uptime: number;
  activeConnections?: number;
  responseTime?: number;
}

interface ErrorLog {
  id: string;
  message: string;
  name: string;
  statusCode: number;
  code: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: {
    endpoint?: string;
    method?: string;
    userId?: string;
    duration?: number;
  };
}

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: string;
  userId?: string;
}

interface LogStats {
  totalLogs: number;
  levelDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  errorRate: number;
  topErrors: Array<{ message: string; count: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function MonitoringDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch system health metrics
      const systemResponse = await fetch('/api/admin/monitoring/system-health');
      if (systemResponse.ok) {
        const systemData = await systemResponse.json();
        setSystemMetrics(systemData.slice(-24)); // Last 24 data points
      }

      // Fetch error logs
      const errorsResponse = await fetch('/api/admin/monitoring/errors?limit=50');
      if (errorsResponse.ok) {
        const errorsData = await errorsResponse.json();
        setErrorLogs(errorsData);
      }

      // Fetch performance metrics
      const performanceResponse = await fetch('/api/admin/monitoring/performance?limit=100');
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        setPerformanceMetrics(performanceData);
      }

      // Fetch log statistics
      const statsResponse = await fetch('/api/admin/monitoring/log-stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setLogStats(statsData);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Calculate system health status
  const getSystemHealthStatus = () => {
    if (!systemMetrics.length) return { status: 'unknown', color: 'gray' };
    
    const latest = systemMetrics[systemMetrics.length - 1];
    const memoryUsagePercent = (latest.memoryUsage.heapUsed / latest.memoryUsage.heapTotal) * 100;
    const criticalErrors = errorLogs.filter(log => log.severity === 'critical').length;
    
    if (criticalErrors > 0 || memoryUsagePercent > 90) {
      return { status: 'critical', color: 'red' };
    }
    if (memoryUsagePercent > 75 || latest.responseTime && latest.responseTime > 2000) {
      return { status: 'warning', color: 'yellow' };
    }
    return { status: 'healthy', color: 'green' };
  };

  const healthStatus = getSystemHealthStatus();

  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Export logs
  const exportLogs = async (type: 'errors' | 'performance' | 'all') => {
    try {
      const response = await fetch(`/api/admin/monitoring/export?type=${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${type}-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and analytics for Broskis Kitchen
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMonitoringData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {healthStatus.status === 'healthy' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {healthStatus.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {healthStatus.status === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              <span className="text-2xl font-bold capitalize">{healthStatus.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics.length > 0 && `Uptime: ${formatDuration(systemMetrics[systemMetrics.length - 1]?.uptime * 1000)}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logStats ? `${logStats.errorRate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {errorLogs.filter(log => log.severity === 'critical').length} critical errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.length > 0
                ? `${Math.round(performanceMetrics.reduce((acc, m) => acc + m.duration, 0) / performanceMetrics.length)}ms`
                : '0ms'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Last 100 requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {systemMetrics.length > 0 && (
              <>
                <div className="text-2xl font-bold">
                  {formatBytes(systemMetrics[systemMetrics.length - 1].memoryUsage.heapUsed)}
                </div>
                <Progress 
                  value={(systemMetrics[systemMetrics.length - 1].memoryUsage.heapUsed / systemMetrics[systemMetrics.length - 1].memoryUsage.heapTotal) * 100}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  of {formatBytes(systemMetrics[systemMetrics.length - 1].memoryUsage.heapTotal)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* System Metrics Chart */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Memory and CPU usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number, name: string) => {
                        if (name.includes('memory')) return [formatBytes(value), name];
                        return [value, name];
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memoryUsage.heapUsed" 
                      stroke="#8884d8" 
                      name="Memory Used"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpuUsage.user" 
                      stroke="#82ca9d" 
                      name="CPU User"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Error Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
                <CardDescription>Errors by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                {logStats && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(logStats.levelDistribution).map(([level, count]) => ({
                          name: level,
                          value: count
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(logStats.levelDistribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>API Performance</CardTitle>
                <CardDescription>Response times for API endpoints</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportLogs('performance')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceMetrics.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="endpoint" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value}ms`, 'Duration']}
                  />
                  <Bar dataKey="duration" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Latest error logs and incidents</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportLogs('errors')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorLogs.slice(0, 10).map((error) => (
                  <Alert key={error.id} className={`border-l-4 ${
                    error.severity === 'critical' ? 'border-l-red-500' :
                    error.severity === 'high' ? 'border-l-orange-500' :
                    error.severity === 'medium' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>{error.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={error.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {error.severity}
                        </Badge>
                        <Badge variant="outline">{error.statusCode}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <p className="font-medium">{error.message}</p>
                        {error.context.endpoint && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {error.context.method} {error.context.endpoint}
                            {error.context.duration && ` (${error.context.duration}ms)`}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Log Statistics</CardTitle>
                <CardDescription>Comprehensive logging analytics</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportLogs('all')}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </CardHeader>
            <CardContent>
              {logStats && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Top Error Messages</h4>
                    <div className="space-y-2">
                      {logStats.topErrors.slice(0, 5).map((error, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm truncate flex-1">{error.message}</span>
                          <Badge variant="secondary">{error.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Source Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(logStats.sourceDistribution).slice(0, 5).map(([source, count]) => (
                        <div key={source} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{source}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
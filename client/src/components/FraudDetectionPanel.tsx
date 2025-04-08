import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define types
interface SuspiciousActivity {
  id: number;
  userId: number;
  reason: string;
  details: string;
  isResolved: boolean;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface ActivityLog {
  id: number;
  userId: number;
  type: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt: string;
}

export default function FraudDetectionPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'activity' | 'suspicious'>('suspicious');
  const [flagForm, setFlagForm] = useState({
    userId: '',
    reason: '',
    details: ''
  });
  const [resolveForm, setResolveForm] = useState({
    id: null as number | null,
    adminNotes: ''
  });

  // Fetch suspicious activities
  const { 
    data: suspiciousActivities,
    isLoading: isLoadingSuspicious
  } = useQuery({
    queryKey: ['/api/suspicious-activities'],
    queryFn: async () => {
      // This is a mock implementation since we don't have a real endpoint yet
      console.log('Fetching suspicious activities');
      return [];
    }
  });

  // Fetch activity logs
  const {
    data: activityLogs,
    isLoading: isLoadingActivity
  } = useQuery({
    queryKey: ['/api/activity-logs'],
    queryFn: async () => {
      // This is a mock implementation since we don't have a real endpoint yet
      console.log('Fetching activity logs');
      return [];
    }
  });

  // Flag suspicious activity mutation
  const flagMutation = useMutation({
    mutationFn: async (data: typeof flagForm) => {
      const res = await apiRequest('POST', '/api/suspicious-activities', {
        ...data,
        userId: parseInt(data.userId)
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Suspicious activity flagged successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suspicious-activities'] });
      setFlagForm({
        userId: '',
        reason: '',
        details: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Resolve suspicious activity mutation
  const resolveMutation = useMutation({
    mutationFn: async (data: { id: number, adminNotes: string }) => {
      const res = await apiRequest('PATCH', `/api/suspicious-activities/${data.id}`, {
        adminNotes: data.adminNotes
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Suspicious activity resolved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suspicious-activities'] });
      setResolveForm({
        id: null,
        adminNotes: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagForm.userId || !flagForm.reason || !flagForm.details) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }
    
    flagMutation.mutate(flagForm);
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveForm.id) {
      return;
    }
    
    resolveMutation.mutate({
      id: resolveForm.id,
      adminNotes: resolveForm.adminNotes
    });
  };

  const handleResolveClick = (activity: SuspiciousActivity) => {
    setResolveForm({
      id: activity.id,
      adminNotes: activity.adminNotes || ''
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fraud Detection</CardTitle>
          <CardDescription>Monitor and manage suspicious activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'activity' | 'suspicious')}>
            <TabsList className="mb-4">
              <TabsTrigger value="suspicious">Suspicious Activities</TabsTrigger>
              <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="suspicious" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Flagged Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingSuspicious ? (
                        <div>Loading activities...</div>
                      ) : suspiciousActivities && suspiciousActivities.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User ID</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Flagged On</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {suspiciousActivities.map((activity: SuspiciousActivity) => (
                              <TableRow key={activity.id}>
                                <TableCell>{activity.userId}</TableCell>
                                <TableCell>{activity.reason}</TableCell>
                                <TableCell>
                                  <Badge variant={activity.isResolved ? "secondary" : "destructive"}>
                                    {activity.isResolved ? 'Resolved' : 'Unresolved'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{new Date(activity.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleResolveClick(activity)}
                                    disabled={activity.isResolved}
                                  >
                                    {activity.isResolved ? 'Resolved' : 'Resolve'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">No suspicious activities found.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Flag Suspicious Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleFlagSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="userId">User ID</Label>
                          <Input 
                            id="userId" 
                            value={flagForm.userId} 
                            onChange={(e) => setFlagForm({...flagForm, userId: e.target.value})}
                            placeholder="Enter user ID"
                            type="number"
                            min="1"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason</Label>
                          <Select 
                            value={flagForm.reason} 
                            onValueChange={(value) => setFlagForm({...flagForm, reason: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multi_account">Multiple Accounts</SelectItem>
                              <SelectItem value="unusual_pattern">Unusual Betting Pattern</SelectItem>
                              <SelectItem value="ip_change">Rapid IP Changes</SelectItem>
                              <SelectItem value="bet_pattern">Suspicious Bet Pattern</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="details">Details</Label>
                          <Textarea 
                            id="details" 
                            value={flagForm.details} 
                            onChange={(e) => setFlagForm({...flagForm, details: e.target.value})}
                            placeholder="Provide details about the suspicious activity"
                            rows={4}
                          />
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={flagMutation.isPending}>
                          Flag Activity
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  
                  {resolveForm.id && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-lg">Resolve Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleResolveSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="adminNotes">Admin Notes</Label>
                            <Textarea 
                              id="adminNotes" 
                              value={resolveForm.adminNotes} 
                              onChange={(e) => setResolveForm({...resolveForm, adminNotes: e.target.value})}
                              placeholder="Add notes about resolution"
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setResolveForm({ id: null, adminNotes: '' })}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="flex-1"
                              disabled={resolveMutation.isPending}
                            >
                              Resolve
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Activity Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingActivity ? (
                    <div>Loading activity logs...</div>
                  ) : activityLogs && activityLogs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Activity Type</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityLogs.map((log: ActivityLog) => (
                          <TableRow key={log.id}>
                            <TableCell>{log.userId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {log.type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.ipAddress || 'Unknown'}</TableCell>
                            <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                            <TableCell>{log.details || 'No details'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">No activity logs found.</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    Activity logs are automatically collected when users perform actions on the platform.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
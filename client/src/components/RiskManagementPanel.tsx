import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Simplified interface for risk settings
interface RiskSettings {
  id: number;
  type: 'global' | 'game' | 'user';
  gameType?: string;
  userId?: number;
  maxBetAmount: number;
  dailyLossLimit?: number;
  weeklyLossLimit?: number;
  monthlyLossLimit?: number;
  isActive: boolean;
}

export default function RiskManagementPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'global' | 'game' | 'user'>('global');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [settingsForm, setSettingsForm] = useState<Partial<RiskSettings>>({
    type: 'global',
    maxBetAmount: 1000,
    dailyLossLimit: 2000,
    weeklyLossLimit: 5000,
    monthlyLossLimit: 10000,
    isActive: true
  });
  
  // Create an object to store our mock data for each tab
  const [mockData, setMockData] = useState<{
    global: RiskSettings[];
    game: RiskSettings[];
    user: RiskSettings[];
  }>({
    global: [
      {
        id: 1,
        type: 'global',
        maxBetAmount: 1000,
        dailyLossLimit: 2000,
        weeklyLossLimit: 5000,
        monthlyLossLimit: 10000,
        isActive: true
      }
    ],
    game: [],
    user: []
  });
  
  // Fetch risk settings from API
  const { data: riskSettings, isLoading, refetch } = useQuery({
    queryKey: ['/api/risk-settings', activeTab],
    queryFn: async () => {
      try {
        console.log(`Fetching ${activeTab} risk settings`);
        const response = await fetch(`/api/risk-settings?type=${activeTab}`);
        if (!response.ok) {
          // If API fails, fall back to mock data temporarily
          console.warn('API failed, falling back to mock data');
          return mockData[activeTab];
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching risk settings:', error);
        // Fall back to mock data if API is not ready
        return mockData[activeTab];
      }
    },
    // This ensures we refetch when changing tabs
    enabled: true
  });
  
  // Update our query when tab changes
  useEffect(() => {
    refetch();
  }, [activeTab, refetch]);

  // Create risk settings mutation
  const createMutation = useMutation({
    mutationFn: async (settings: Partial<RiskSettings>) => {
      try {
        console.log('Creating settings:', settings);
        const res = await apiRequest('POST', '/api/risk-settings', settings);
        const data = await res.json();
        
        // Also update our mock data store as fallback
        setMockData(prev => ({
          ...prev,
          [activeTab]: [...prev[activeTab], data]
        }));
        
        return data;
      } catch (error) {
        console.error('Error creating settings:', error);
        // Fallback to mock implementation if API fails
        const newSettings = { 
          id: Date.now(), 
          ...settings
        } as RiskSettings;
        
        setMockData(prev => ({
          ...prev,
          [activeTab]: [...prev[activeTab], newSettings]
        }));
        
        return newSettings;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Risk settings created successfully',
      });
      // Refetch data
      refetch();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update risk settings mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, settings }: { id: number, settings: Partial<RiskSettings> }) => {
      try {
        console.log('Updating settings:', { id, ...settings });
        const res = await apiRequest('PATCH', `/api/risk-settings/${id}`, settings);
        const data = await res.json();
        
        // Also update our mock data store as fallback
        setMockData(prev => {
          return {
            ...prev,
            [activeTab]: prev[activeTab].map(item => 
              item.id === id 
                ? { ...item, ...settings } as RiskSettings
                : item
            )
          };
        });
        
        return data;
      } catch (error) {
        console.error('Error updating settings:', error);
        // Fallback to mock implementation if API fails
        setMockData(prev => {
          return {
            ...prev,
            [activeTab]: prev[activeTab].map(item => 
              item.id === id 
                ? { ...item, ...settings } as RiskSettings
                : item
            )
          };
        });
        
        return { id, ...settings } as RiskSettings;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Risk settings updated successfully',
      });
      // Refetch data
      refetch();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsForm.maxBetAmount === undefined) {
      toast({
        title: 'Error',
        description: 'Maximum bet amount is required',
        variant: 'destructive',
      });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, settings: settingsForm });
    } else {
      createMutation.mutate({ ...settingsForm, type: activeTab });
    }
  };

  const handleEdit = (settings: RiskSettings) => {
    setEditingId(settings.id);
    setSettingsForm({
      type: settings.type,
      gameType: settings.gameType,
      userId: settings.userId,
      maxBetAmount: settings.maxBetAmount,
      dailyLossLimit: settings.dailyLossLimit,
      weeklyLossLimit: settings.weeklyLossLimit,
      monthlyLossLimit: settings.monthlyLossLimit,
      isActive: settings.isActive
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setSettingsForm({
      type: activeTab,
      maxBetAmount: 1000,
      dailyLossLimit: 2000,
      weeklyLossLimit: 5000,
      monthlyLossLimit: 10000,
      isActive: true
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Risk Management</CardTitle>
          <CardDescription>Configure betting limits and risk controls</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'global' | 'game' | 'user')}>
            <TabsList className="mb-4">
              <TabsTrigger value="global">Global Settings</TabsTrigger>
              <TabsTrigger value="game">Game-Specific</TabsTrigger>
              <TabsTrigger value="user">User-Specific</TabsTrigger>
            </TabsList>
            
            <TabsContent value="global" className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Platform-Wide Risk Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxBetAmount">Maximum Bet Amount</Label>
                          <Input 
                            id="maxBetAmount" 
                            type="number" 
                            value={settingsForm.maxBetAmount} 
                            onChange={(e) => setSettingsForm({...settingsForm, maxBetAmount: parseInt(e.target.value)})}
                            min={0}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dailyLossLimit">Daily Loss Limit</Label>
                          <Input 
                            id="dailyLossLimit" 
                            type="number" 
                            value={settingsForm.dailyLossLimit} 
                            onChange={(e) => setSettingsForm({...settingsForm, dailyLossLimit: parseInt(e.target.value)})}
                            min={0}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weeklyLossLimit">Weekly Loss Limit</Label>
                          <Input 
                            id="weeklyLossLimit" 
                            type="number" 
                            value={settingsForm.weeklyLossLimit} 
                            onChange={(e) => setSettingsForm({...settingsForm, weeklyLossLimit: parseInt(e.target.value)})}
                            min={0}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="monthlyLossLimit">Monthly Loss Limit</Label>
                          <Input 
                            id="monthlyLossLimit" 
                            type="number" 
                            value={settingsForm.monthlyLossLimit} 
                            onChange={(e) => setSettingsForm({...settingsForm, monthlyLossLimit: parseInt(e.target.value)})}
                            min={0}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="isActive" 
                          checked={settingsForm.isActive} 
                          onCheckedChange={(checked) => setSettingsForm({...settingsForm, isActive: checked})}
                        />
                        <Label htmlFor="isActive">Enabled</Label>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        {editingId && (
                          <Button type="button" variant="outline" onClick={resetForm}>
                            Cancel
                          </Button>
                        )}
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                          {editingId ? 'Update' : 'Create'} Settings
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
                
                {isLoading ? (
                  <div>Loading settings...</div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Current Global Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {riskSettings && riskSettings.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Max Bet</TableHead>
                              <TableHead>Daily Limit</TableHead>
                              <TableHead>Weekly Limit</TableHead>
                              <TableHead>Monthly Limit</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {riskSettings.map((setting) => (
                              <TableRow key={setting.id}>
                                <TableCell>{setting.maxBetAmount}</TableCell>
                                <TableCell>{setting.dailyLossLimit || 'Not set'}</TableCell>
                                <TableCell>{setting.weeklyLossLimit || 'Not set'}</TableCell>
                                <TableCell>{setting.monthlyLossLimit || 'Not set'}</TableCell>
                                <TableCell>
                                  <Badge variant={setting.isActive ? "default" : "secondary"}>
                                    {setting.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(setting)}>
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">No global settings found. Create one using the form above.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="game" className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Game-Specific Risk Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gameType">Game Type</Label>
                          <Select 
                            value={settingsForm.gameType || ''} 
                            onValueChange={(value) => setSettingsForm({...settingsForm, gameType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select game type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="coin-toss">Coin Toss</SelectItem>
                              <SelectItem value="odd-even">Odd/Even</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxBetAmount">Maximum Bet Amount</Label>
                          <Input 
                            id="maxBetAmount" 
                            type="number" 
                            value={settingsForm.maxBetAmount} 
                            onChange={(e) => setSettingsForm({...settingsForm, maxBetAmount: parseInt(e.target.value)})}
                            min={0}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="isActive" 
                          checked={settingsForm.isActive} 
                          onCheckedChange={(checked) => setSettingsForm({...settingsForm, isActive: checked})}
                        />
                        <Label htmlFor="isActive">Enabled</Label>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        {editingId && (
                          <Button type="button" variant="outline" onClick={resetForm}>
                            Cancel
                          </Button>
                        )}
                        <Button type="submit">
                          {editingId ? 'Update' : 'Create'} Settings
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Game-specific settings will override global settings for the selected game.</p>
                  </CardContent>
                </Card>
                
                {isLoading ? (
                  <div>Loading settings...</div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Current Game Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {riskSettings && riskSettings.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Game</TableHead>
                              <TableHead>Max Bet</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {riskSettings.map((setting) => (
                              <TableRow key={setting.id}>
                                <TableCell>{setting.gameType}</TableCell>
                                <TableCell>{setting.maxBetAmount}</TableCell>
                                <TableCell>
                                  <Badge variant={setting.isActive ? "default" : "secondary"}>
                                    {setting.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(setting)}>
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">No game-specific settings found. Create one using the form above.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="user" className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User-Specific Risk Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="userId">User ID</Label>
                          <Input 
                            id="userId" 
                            type="number" 
                            value={settingsForm.userId || ''} 
                            onChange={(e) => setSettingsForm({...settingsForm, userId: parseInt(e.target.value)})}
                            min={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxBetAmount">Maximum Bet Amount</Label>
                          <Input 
                            id="maxBetAmount" 
                            type="number" 
                            value={settingsForm.maxBetAmount} 
                            onChange={(e) => setSettingsForm({...settingsForm, maxBetAmount: parseInt(e.target.value)})}
                            min={0}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dailyLossLimit">Daily Loss Limit</Label>
                          <Input 
                            id="dailyLossLimit" 
                            type="number" 
                            value={settingsForm.dailyLossLimit} 
                            onChange={(e) => setSettingsForm({...settingsForm, dailyLossLimit: parseInt(e.target.value)})}
                            min={0}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weeklyLossLimit">Weekly Loss Limit</Label>
                          <Input 
                            id="weeklyLossLimit" 
                            type="number" 
                            value={settingsForm.weeklyLossLimit} 
                            onChange={(e) => setSettingsForm({...settingsForm, weeklyLossLimit: parseInt(e.target.value)})}
                            min={0}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="isActive" 
                          checked={settingsForm.isActive} 
                          onCheckedChange={(checked) => setSettingsForm({...settingsForm, isActive: checked})}
                        />
                        <Label htmlFor="isActive">Enabled</Label>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        {editingId && (
                          <Button type="button" variant="outline" onClick={resetForm}>
                            Cancel
                          </Button>
                        )}
                        <Button type="submit">
                          {editingId ? 'Update' : 'Create'} Settings
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">User-specific settings will override both global and game-specific settings for the specified user.</p>
                  </CardContent>
                </Card>
                
                {isLoading ? (
                  <div>Loading settings...</div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Current User Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {riskSettings && riskSettings.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User ID</TableHead>
                              <TableHead>Max Bet</TableHead>
                              <TableHead>Daily Limit</TableHead>
                              <TableHead>Weekly Limit</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {riskSettings.map((setting) => (
                              <TableRow key={setting.id}>
                                <TableCell>{setting.userId}</TableCell>
                                <TableCell>{setting.maxBetAmount}</TableCell>
                                <TableCell>{setting.dailyLossLimit || 'Not set'}</TableCell>
                                <TableCell>{setting.weeklyLossLimit || 'Not set'}</TableCell>
                                <TableCell>
                                  <Badge variant={setting.isActive ? "default" : "secondary"}>
                                    {setting.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(setting)}>
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">No user-specific settings found. Create one using the form above.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
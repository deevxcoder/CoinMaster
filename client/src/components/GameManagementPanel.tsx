import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Simplified interface for game configuration
interface GameConfiguration {
  id: number;
  gameType: string;
  displayName: string;
  description: string;
  minBet: number;
  maxBet: number;
  houseEdge: number;
  payoutMultiplier: number;
  status: 'active' | 'disabled' | 'maintenance' | 'testing';
  customSettings?: string;
  createdAt: string;
  updatedAt: string;
}

type GameStatus = 'active' | 'disabled' | 'maintenance' | 'testing';

export default function GameManagementPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [gameForm, setGameForm] = useState<Partial<GameConfiguration>>({
    gameType: "",
    displayName: "",
    description: "",
    minBet: 10,
    maxBet: 1000,
    houseEdge: 2,
    payoutMultiplier: 1.96,
    status: 'active',
    customSettings: ""
  });
  
  // Mock data for initial display
  const [mockData, setMockData] = useState<GameConfiguration[]>([
    {
      id: 1,
      gameType: "coin-toss",
      displayName: "Coin Toss",
      description: "A simple 50/50 game where you bet on heads or tails.",
      minBet: 10,
      maxBet: 1000,
      houseEdge: 2,
      payoutMultiplier: 1.96,
      status: 'active',
      customSettings: JSON.stringify({ 
        animationSpeed: "normal",
        soundEffects: true
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      gameType: "odd-even",
      displayName: "Odd or Even",
      description: "Bet on whether the number will be odd or even.",
      minBet: 10,
      maxBet: 1000,
      houseEdge: 2,
      payoutMultiplier: 1.96,
      status: 'active',
      customSettings: JSON.stringify({ 
        numberRange: "1-100",
        showHistory: true
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
  
  // Fetch game configurations from API
  const { data: gameConfigurations, isLoading, refetch } = useQuery({
    queryKey: ['/api/game-configurations'],
    queryFn: async () => {
      try {
        console.log('Fetching game configurations');
        const response = await fetch('/api/game-configurations');
        if (!response.ok) {
          console.warn('API failed, falling back to mock data');
          return mockData;
        }
        const data = await response.json();
        console.log('Received game configurations from server:', data);
        
        // Only update our mock data if we got valid data
        if (Array.isArray(data) && data.length > 0) {
          // Update our mock data to match the server data
          setMockData(data);
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching game configurations:', error);
        // Fall back to mock data if API is not ready
        return mockData;
      }
    },
    // Force refetch when component mounts
    refetchOnMount: true
  });
  
  // Create or update game configuration mutation
  const saveMutation = useMutation({
    mutationFn: async (gameConfig: Partial<GameConfiguration>) => {
      try {
        console.log('Saving game configuration:', gameConfig);
        
        // Update UI immediately for better UX
        if (editingId) {
          setMockData(prev => 
            prev.map(config => 
              config.id === editingId 
                ? { 
                    ...config, 
                    ...gameConfig, 
                    updatedAt: new Date().toISOString() 
                  } 
                : config
            )
          );
        } else {
          const newConfig = {
            id: Date.now(),
            ...gameConfig,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as GameConfiguration;
          
          setMockData(prev => [...prev, newConfig]);
        }
        
        let data;
        
        if (editingId && gameConfig.gameType) {
          // Update existing game config
          console.log(`Updating game config for ${gameConfig.gameType}`);
          const res = await apiRequest('PATCH', `/api/game-configurations/${gameConfig.gameType}`, gameConfig);
          data = await res.json();
          console.log('Update response:', data);
        } else {
          // Create new game config
          console.log(`Creating new game config for ${gameConfig.gameType}`);
          const res = await apiRequest('POST', `/api/game-configurations/${gameConfig.gameType}`, gameConfig);
          data = await res.json();
          console.log('Create response:', data);
        }
        
        return data;
      } catch (error) {
        console.error('Error saving game configuration:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: editingId 
          ? 'Game configuration updated successfully' 
          : 'Game configuration created successfully',
      });
      
      // Force multiple refetches to ensure we get updated data
      // First immediate refetch
      refetch();
      
      // Second delayed refetch
      setTimeout(async () => {
        await refetch();
        console.log('Refetched game configurations after save');
      }, 1000);
      
      resetForm();
      setActiveTab('list');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to save game configuration. Please try again.',
        variant: 'destructive',
      });
      console.error('Mutation error:', error);
    }
  });
  
  const handleChange = (
    key: keyof GameConfiguration, 
    value: string | number | boolean | GameStatus
  ) => {
    setGameForm(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!gameForm.gameType || !gameForm.displayName) {
      toast({
        title: 'Validation Error',
        description: 'Game type and display name are required',
        variant: 'destructive',
      });
      return;
    }
    
    saveMutation.mutate(gameForm);
  };
  
  const handleEditClick = (game: GameConfiguration) => {
    setEditingId(game.id);
    setGameForm({
      gameType: game.gameType,
      displayName: game.displayName,
      description: game.description,
      minBet: game.minBet,
      maxBet: game.maxBet,
      houseEdge: game.houseEdge,
      payoutMultiplier: game.payoutMultiplier,
      status: game.status,
      customSettings: game.customSettings
    });
    setActiveTab('create');
  };
  
  const resetForm = () => {
    setEditingId(null);
    setGameForm({
      gameType: "",
      displayName: "",
      description: "",
      minBet: 10,
      maxBet: 1000,
      houseEdge: 2,
      payoutMultiplier: 1.96,
      status: 'active',
      customSettings: ""
    });
  };
  
  const getStatusColor = (status: GameStatus) => {
    switch(status) {
      case 'active': return "default";
      case 'disabled': return "secondary";
      case 'maintenance': return "destructive";
      case 'testing': return "outline";
      default: return "secondary";
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Management</CardTitle>
          <CardDescription>Configure and deploy games</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'create')}>
            <TabsList className="mb-4">
              <TabsTrigger value="list">Game List</TabsTrigger>
              <TabsTrigger value="create">{editingId ? 'Edit' : 'Create'} Game</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => { resetForm(); setActiveTab('create'); }}>
                  Add New Game
                </Button>
              </div>
              
              {isLoading ? (
                <div>Loading game configurations...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Min/Max Bet</TableHead>
                      <TableHead>House Edge</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameConfigurations && gameConfigurations.length > 0 ? (
                      gameConfigurations.map((game) => (
                        <TableRow key={game.id}>
                          <TableCell className="font-medium">{game.gameType}</TableCell>
                          <TableCell>{game.displayName}</TableCell>
                          <TableCell>{game.minBet} / {game.maxBet}</TableCell>
                          <TableCell>{game.houseEdge}%</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(game.status)}>
                              {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditClick(game)}
                              className="mr-2"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  // Toggle game status between active and disabled
                                  const newStatus = game.status === 'active' ? 'disabled' : 'active';
                                  
                                  // Update the UI immediately for better UX
                                  setMockData(prev =>
                                    prev.map(config =>
                                      config.id === game.id
                                        ? { ...config, status: newStatus, updatedAt: new Date().toISOString() }
                                        : config
                                    )
                                  );
                                  
                                  // Try to update via API
                                  try {
                                    console.log(`Toggling game ${game.gameType} status to ${newStatus}`);
                                    const res = await apiRequest('PATCH', `/api/game-configurations/${game.gameType}`, {
                                      status: newStatus
                                    });
                                    const data = await res.json();
                                    console.log('Toggle response:', data);
                                  } catch (error) {
                                    console.error('API error during toggle:', error);
                                  }
                                  
                                  // Force multiple refetches to ensure we get updated data
                                  // First immediate refetch
                                  await refetch();
                                  
                                  // Second delayed refetch
                                  setTimeout(async () => {
                                    await refetch();
                                    console.log('Refetched game configurations after toggle');
                                  }, 1000);
                                  
                                  toast({
                                    title: 'Success',
                                    description: `Game ${newStatus === 'active' ? 'activated' : 'disabled'} successfully`,
                                  });
                                } catch (error) {
                                  toast({
                                    title: 'Error',
                                    description: 'Failed to update game status',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              {game.status === 'active' ? 'Disable' : 'Enable'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No game configurations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gameType">Game Type (Identifier)</Label>
                      <Input
                        id="gameType"
                        placeholder="e.g., coin-toss, odd-even"
                        value={gameForm.gameType}
                        onChange={(e) => handleChange('gameType', e.target.value)}
                        disabled={!!editingId} // Can't change game type when editing
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="e.g., Coin Toss, Odd or Even"
                        value={gameForm.displayName}
                        onChange={(e) => handleChange('displayName', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the game rules and how to play"
                        value={gameForm.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={gameForm.status} 
                        onValueChange={(v) => handleChange('status', v as GameStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="testing">Testing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="minBet">Minimum Bet</Label>
                      <Input
                        id="minBet"
                        type="number"
                        value={gameForm.minBet}
                        onChange={(e) => handleChange('minBet', parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxBet">Maximum Bet</Label>
                      <Input
                        id="maxBet"
                        type="number"
                        value={gameForm.maxBet}
                        onChange={(e) => handleChange('maxBet', parseInt(e.target.value))}
                        min={gameForm.minBet || 1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="houseEdge">House Edge (%)</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          id="houseEdge"
                          value={[gameForm.houseEdge || 2]}
                          onValueChange={(values) => handleChange('houseEdge', values[0])}
                          min={0}
                          max={10}
                          step={0.1}
                          className="flex-1"
                        />
                        <span className="w-12 text-right">{gameForm.houseEdge}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="payoutMultiplier">Payout Multiplier</Label>
                      <Input
                        id="payoutMultiplier"
                        type="number"
                        value={gameForm.payoutMultiplier}
                        onChange={(e) => handleChange('payoutMultiplier', parseFloat(e.target.value))}
                        min={1}
                        step={0.01}
                      />
                      <p className="text-xs text-muted-foreground">
                        For a house edge of {gameForm.houseEdge}%, a fair multiplier would be around {(100 / (100 - (gameForm.houseEdge || 0))).toFixed(2)}x
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customSettings">Custom Settings (JSON)</Label>
                      <Textarea
                        id="customSettings"
                        placeholder='{"animationSpeed": "normal", "soundEffects": true}'
                        value={gameForm.customSettings}
                        onChange={(e) => handleChange('customSettings', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      resetForm();
                      setActiveTab('list');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {editingId ? 'Update' : 'Create'} Game
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
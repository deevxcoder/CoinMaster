import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define types
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

export default function GameManagementPanel() {
  const { toast } = useToast();
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<Partial<GameConfiguration>>({
    gameType: '',
    displayName: '',
    description: '',
    minBet: 10,
    maxBet: 1000,
    houseEdge: 200, // 2%
    payoutMultiplier: 200, // 2x
    status: 'active'
  });
  const [newGameForm, setNewGameForm] = useState({
    gameType: '',
    displayName: '',
    description: '',
    minBet: 10,
    maxBet: 1000,
    houseEdge: 200,
    payoutMultiplier: 200,
    status: 'testing',
    gameLogic: `// Game Logic Template
function playGame(playerChoice, betAmount) {
  // Determine outcome
  const result = Math.random() < 0.5 ? 'win' : 'lose';
  
  // Calculate payout
  const payout = result === 'win' ? betAmount * 2 : 0;
  
  return {
    result,
    payout
  };
}`
  });

  // Fetch game configurations
  const { 
    data: gameConfigurations,
    isLoading: isLoadingConfigs
  } = useQuery({
    queryKey: ['/api/game-configurations'],
    queryFn: async () => {
      const response = await fetch('/api/game-configurations');
      if (!response.ok) {
        throw new Error('Failed to fetch game configurations');
      }
      return response.json();
    }
  });

  // Update game configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: { gameType: string, config: Partial<GameConfiguration> }) => {
      const res = await apiRequest('POST', `/api/game-configurations/${data.gameType}`, data.config);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Game configuration updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/game-configurations'] });
      setEditingGame(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Create new game mutation
  const createGameMutation = useMutation({
    mutationFn: async (data: typeof newGameForm) => {
      const res = await apiRequest('POST', `/api/game-configurations/${data.gameType}`, {
        displayName: data.displayName,
        description: data.description,
        minBet: data.minBet,
        maxBet: data.maxBet,
        houseEdge: data.houseEdge,
        payoutMultiplier: data.payoutMultiplier,
        status: data.status,
        customSettings: JSON.stringify({ gameLogic: data.gameLogic })
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'New game created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/game-configurations'] });
      resetNewGameForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleEdit = (gameType: string) => {
    const game = gameConfigurations.find((g: GameConfiguration) => g.gameType === gameType);
    if (game) {
      setEditingGame(gameType);
      setConfigForm({
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
    }
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGame) {
      updateConfigMutation.mutate({
        gameType: editingGame,
        config: configForm
      });
    }
  };

  const handleNewGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameForm.gameType || !newGameForm.displayName || !newGameForm.description) {
      toast({
        title: 'Error',
        description: 'Game type, display name, and description are required',
        variant: 'destructive',
      });
      return;
    }
    
    createGameMutation.mutate(newGameForm);
  };

  const resetNewGameForm = () => {
    setNewGameForm({
      gameType: '',
      displayName: '',
      description: '',
      minBet: 10,
      maxBet: 1000,
      houseEdge: 200,
      payoutMultiplier: 200,
      status: 'testing',
      gameLogic: `// Game Logic Template
function playGame(playerChoice, betAmount) {
  // Determine outcome
  const result = Math.random() < 0.5 ? 'win' : 'lose';
  
  // Calculate payout
  const payout = result === 'win' ? betAmount * 2 : 0;
  
  return {
    result,
    payout
  };
}`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'testing':
        return 'secondary';
      case 'disabled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Management</CardTitle>
          <CardDescription>Configure and deploy games on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Games */}
          <div>
            <h3 className="text-lg font-medium mb-4">Current Games</h3>
            {isLoadingConfigs ? (
              <div>Loading game configurations...</div>
            ) : gameConfigurations && gameConfigurations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game Type</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Min/Max Bet</TableHead>
                    <TableHead>House Edge</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameConfigurations.map((game: GameConfiguration) => (
                    <TableRow key={game.id}>
                      <TableCell>{game.gameType}</TableCell>
                      <TableCell>{game.displayName}</TableCell>
                      <TableCell>{game.minBet} / {game.maxBet}</TableCell>
                      <TableCell>{(game.houseEdge / 100).toFixed(2)}%</TableCell>
                      <TableCell>{(game.payoutMultiplier / 100).toFixed(2)}x</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(game.status) as any}>
                          {game.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(game.gameType)}
                        >
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No game configurations found.</p>
            )}
          </div>

          <Separator />

          {/* Edit Game Configuration */}
          {editingGame && (
            <div>
              <h3 className="text-lg font-medium mb-4">Edit Game Configuration: {editingGame}</h3>
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleConfigSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input 
                          id="displayName" 
                          value={configForm.displayName} 
                          onChange={(e) => setConfigForm({...configForm, displayName: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={configForm.status} 
                          onValueChange={(value) => setConfigForm({...configForm, status: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="testing">Testing</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          value={configForm.description} 
                          onChange={(e) => setConfigForm({...configForm, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="minBet">Minimum Bet</Label>
                        <Input 
                          id="minBet" 
                          type="number" 
                          value={configForm.minBet} 
                          onChange={(e) => setConfigForm({...configForm, minBet: parseInt(e.target.value)})}
                          min={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxBet">Maximum Bet</Label>
                        <Input 
                          id="maxBet" 
                          type="number" 
                          value={configForm.maxBet} 
                          onChange={(e) => setConfigForm({...configForm, maxBet: parseInt(e.target.value)})}
                          min={configForm.minBet || 1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="houseEdge">House Edge (%)</Label>
                        <Input 
                          id="houseEdge" 
                          type="number" 
                          value={configForm.houseEdge ? (configForm.houseEdge / 100) : ''} 
                          onChange={(e) => setConfigForm({...configForm, houseEdge: Math.round(parseFloat(e.target.value) * 100)})}
                          step={0.01}
                          min={0}
                          max={100}
                        />
                        <p className="text-xs text-muted-foreground">Enter percentage (e.g., 2 for 2%)</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="payoutMultiplier">Payout Multiplier</Label>
                        <Input 
                          id="payoutMultiplier" 
                          type="number" 
                          value={configForm.payoutMultiplier ? (configForm.payoutMultiplier / 100) : ''} 
                          onChange={(e) => setConfigForm({...configForm, payoutMultiplier: Math.round(parseFloat(e.target.value) * 100)})}
                          step={0.01}
                          min={1}
                        />
                        <p className="text-xs text-muted-foreground">Enter multiplier (e.g., 2 for 2x)</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setEditingGame(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateConfigMutation.isPending}>
                        Update Configuration
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />

          {/* New Game Form */}
          <div>
            <h3 className="text-lg font-medium mb-4">Add New Game</h3>
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleNewGameSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newGameType">Game Type (ID)</Label>
                      <Input 
                        id="newGameType" 
                        value={newGameForm.gameType} 
                        onChange={(e) => setNewGameForm({...newGameForm, gameType: e.target.value})}
                        placeholder="e.g., blackjack"
                      />
                      <p className="text-xs text-muted-foreground">Unique identifier for the game (no spaces)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newDisplayName">Display Name</Label>
                      <Input 
                        id="newDisplayName" 
                        value={newGameForm.displayName} 
                        onChange={(e) => setNewGameForm({...newGameForm, displayName: e.target.value})}
                        placeholder="e.g., Blackjack"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="newDescription">Description</Label>
                      <Textarea 
                        id="newDescription" 
                        value={newGameForm.description} 
                        onChange={(e) => setNewGameForm({...newGameForm, description: e.target.value})}
                        placeholder="Describe the game for players"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newMinBet">Minimum Bet</Label>
                      <Input 
                        id="newMinBet" 
                        type="number" 
                        value={newGameForm.minBet} 
                        onChange={(e) => setNewGameForm({...newGameForm, minBet: parseInt(e.target.value)})}
                        min={1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newMaxBet">Maximum Bet</Label>
                      <Input 
                        id="newMaxBet" 
                        type="number" 
                        value={newGameForm.maxBet} 
                        onChange={(e) => setNewGameForm({...newGameForm, maxBet: parseInt(e.target.value)})}
                        min={newGameForm.minBet}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newHouseEdge">House Edge (%)</Label>
                      <Input 
                        id="newHouseEdge" 
                        type="number" 
                        value={newGameForm.houseEdge / 100} 
                        onChange={(e) => setNewGameForm({...newGameForm, houseEdge: Math.round(parseFloat(e.target.value) * 100)})}
                        step={0.01}
                        min={0}
                        max={100}
                      />
                      <p className="text-xs text-muted-foreground">Enter percentage (e.g., 2 for 2%)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPayoutMultiplier">Payout Multiplier</Label>
                      <Input 
                        id="newPayoutMultiplier" 
                        type="number" 
                        value={newGameForm.payoutMultiplier / 100} 
                        onChange={(e) => setNewGameForm({...newGameForm, payoutMultiplier: Math.round(parseFloat(e.target.value) * 100)})}
                        step={0.01}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">Enter multiplier (e.g., 2 for 2x)</p>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="newGameLogic">Game Logic (JavaScript)</Label>
                      <Textarea 
                        id="newGameLogic" 
                        value={newGameForm.gameLogic} 
                        onChange={(e) => setNewGameForm({...newGameForm, gameLogic: e.target.value})}
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Define the game logic in JavaScript. This will be stored as custom settings.
                      </p>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2 flex items-center space-x-2">
                      <Switch 
                        id="testMode" 
                        checked={newGameForm.status === 'testing'} 
                        onCheckedChange={(checked) => setNewGameForm({...newGameForm, status: checked ? 'testing' : 'active'})}
                      />
                      <Label htmlFor="testMode">Create in Test Mode</Label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={resetNewGameForm}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={createGameMutation.isPending}>
                      Create Game
                    </Button>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Note: After creating a game, you'll need to implement the frontend components to integrate it with the platform.
                </p>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
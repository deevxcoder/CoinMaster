import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Define types
interface GameMetrics {
  id: number;
  date: string;
  gameType: string;
  totalBets: number;
  totalWagers: number;
  totalPayouts: number;
  uniquePlayers: number;
  period: string;
}

interface FinancialMetrics {
  id: number;
  date: string;
  totalDeposits: number;
  totalDepositAmount: number;
  totalWithdrawals: number;
  totalWithdrawalAmount: number;
  netRevenue: number;
  period: string;
}

interface UserMetrics {
  id: number;
  date: string;
  newUsers: number;
  activeUsers: number;
  retentionRate: number;
  churnRate: number;
  avgSessionTime: number;
  period: string;
}

export default function AnalyticsPanel() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  // Construct the query parameters
  const getQueryParams = () => {
    const params = new URLSearchParams();
    params.append('period', period);
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }
    return params.toString();
  };

  // Fetch game metrics
  const { 
    data: gameMetrics,
    isLoading: isLoadingGameMetrics
  } = useQuery({
    queryKey: ['/api/analytics/games', period, startDate, endDate],
    queryFn: async () => {
      // This is a mock implementation since we don't have a real endpoint yet
      console.log(`Fetching game metrics with ${getQueryParams()}`);
      return [];
    }
  });

  // Fetch financial metrics
  const {
    data: financialMetrics,
    isLoading: isLoadingFinancialMetrics
  } = useQuery({
    queryKey: ['/api/analytics/finances', period, startDate, endDate],
    queryFn: async () => {
      // This is a mock implementation since we don't have a real endpoint yet
      console.log(`Fetching financial metrics with ${getQueryParams()}`);
      return [];
    }
  });

  // Fetch user metrics
  const {
    data: userMetrics,
    isLoading: isLoadingUserMetrics
  } = useQuery({
    queryKey: ['/api/analytics/users', period, startDate, endDate],
    queryFn: async () => {
      // This is a mock implementation since we don't have a real endpoint yet
      console.log(`Fetching user metrics with ${getQueryParams()}`);
      return [];
    }
  });

  // Calculate metrics for summary cards
  const calculateSummary = () => {
    const summary = {
      totalBets: 0,
      totalWagers: 0,
      totalPayouts: 0,
      totalDeposits: 0,
      totalDepositAmount: 0,
      totalWithdrawals: 0,
      totalWithdrawalAmount: 0,
      netRevenue: 0,
      activeUsers: 0,
      newUsers: 0
    };
    
    if (gameMetrics && gameMetrics.length > 0) {
      gameMetrics.forEach((metric: GameMetrics) => {
        summary.totalBets += metric.totalBets;
        summary.totalWagers += metric.totalWagers;
        summary.totalPayouts += metric.totalPayouts;
      });
    }
    
    if (financialMetrics && financialMetrics.length > 0) {
      financialMetrics.forEach((metric: FinancialMetrics) => {
        summary.totalDeposits += metric.totalDeposits;
        summary.totalDepositAmount += metric.totalDepositAmount;
        summary.totalWithdrawals += metric.totalWithdrawals;
        summary.totalWithdrawalAmount += metric.totalWithdrawalAmount;
        summary.netRevenue += metric.netRevenue;
      });
    }
    
    if (userMetrics && userMetrics.length > 0) {
      userMetrics.forEach((metric: UserMetrics) => {
        summary.activeUsers += metric.activeUsers;
        summary.newUsers += metric.newUsers;
      });
    }
    
    return summary;
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
          <CardDescription>View and analyze platform performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="space-y-2 flex-1">
              <Label htmlFor="period">Time Period</Label>
              <Select value={period} onValueChange={(value) => setPeriod(value as 'daily' | 'weekly' | 'monthly')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex-1">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2 flex-1">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Total Bets</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="text-2xl font-bold">{summary.totalBets.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total wager: ${summary.totalWagers.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Revenue</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="text-2xl font-bold">${summary.netRevenue.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">
                  Payouts: ${summary.totalPayouts.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Deposits</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="text-2xl font-bold">{summary.totalDeposits.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">
                  Amount: ${summary.totalDepositAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Active Users</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="text-2xl font-bold">{summary.activeUsers.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">
                  New users: {summary.newUsers.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Tabs */}
          <Tabs defaultValue="games">
            <TabsList className="mb-6">
              <TabsTrigger value="games">Game Metrics</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="users">User Metrics</TabsTrigger>
            </TabsList>
            
            {/* Game Metrics Tab */}
            <TabsContent value="games">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Game Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingGameMetrics ? (
                    <div>Loading game metrics...</div>
                  ) : gameMetrics && gameMetrics.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Game</TableHead>
                          <TableHead>Total Bets</TableHead>
                          <TableHead>Wager Amount</TableHead>
                          <TableHead>Payout Amount</TableHead>
                          <TableHead>House Edge</TableHead>
                          <TableHead>Players</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gameMetrics.map((metric: GameMetrics) => (
                          <TableRow key={metric.id}>
                            <TableCell>{new Date(metric.date).toLocaleDateString()}</TableCell>
                            <TableCell>{metric.gameType === 'coin-toss' ? 'Coin Toss' : 'Odd/Even'}</TableCell>
                            <TableCell>{metric.totalBets.toLocaleString()}</TableCell>
                            <TableCell>${metric.totalWagers.toLocaleString()}</TableCell>
                            <TableCell>${metric.totalPayouts.toLocaleString()}</TableCell>
                            <TableCell>
                              {metric.totalWagers > 0 
                                ? `${(((metric.totalWagers - metric.totalPayouts) / metric.totalWagers) * 100).toFixed(2)}%` 
                                : '0%'}
                            </TableCell>
                            <TableCell>{metric.uniquePlayers.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground py-10">
                      No game metrics available for the selected period.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Financial Metrics Tab */}
            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingFinancialMetrics ? (
                    <div>Loading financial metrics...</div>
                  ) : financialMetrics && financialMetrics.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Deposits</TableHead>
                          <TableHead>Deposit Amount</TableHead>
                          <TableHead>Withdrawals</TableHead>
                          <TableHead>Withdrawal Amount</TableHead>
                          <TableHead>Net Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialMetrics.map((metric: FinancialMetrics) => (
                          <TableRow key={metric.id}>
                            <TableCell>{new Date(metric.date).toLocaleDateString()}</TableCell>
                            <TableCell>{metric.totalDeposits.toLocaleString()}</TableCell>
                            <TableCell>${metric.totalDepositAmount.toLocaleString()}</TableCell>
                            <TableCell>{metric.totalWithdrawals.toLocaleString()}</TableCell>
                            <TableCell>${metric.totalWithdrawalAmount.toLocaleString()}</TableCell>
                            <TableCell>${metric.netRevenue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground py-10">
                      No financial metrics available for the selected period.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* User Metrics Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingUserMetrics ? (
                    <div>Loading user metrics...</div>
                  ) : userMetrics && userMetrics.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>New Users</TableHead>
                          <TableHead>Active Users</TableHead>
                          <TableHead>Retention Rate</TableHead>
                          <TableHead>Churn Rate</TableHead>
                          <TableHead>Avg. Session Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userMetrics.map((metric: UserMetrics) => (
                          <TableRow key={metric.id}>
                            <TableCell>{new Date(metric.date).toLocaleDateString()}</TableCell>
                            <TableCell>{metric.newUsers.toLocaleString()}</TableCell>
                            <TableCell>{metric.activeUsers.toLocaleString()}</TableCell>
                            <TableCell>{(metric.retentionRate / 100).toFixed(2)}%</TableCell>
                            <TableCell>{(metric.churnRate / 100).toFixed(2)}%</TableCell>
                            <TableCell>{`${Math.floor(metric.avgSessionTime / 60)}m ${metric.avgSessionTime % 60}s`}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground py-10">
                      No user metrics available for the selected period.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
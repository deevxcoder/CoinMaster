import { useQuery } from "@tanstack/react-query";
import GameCard from "@/components/GameCard";
import { useBalance } from "@/hooks/use-balance";
import { useGameHistory } from "@/hooks/use-game-history";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import Leaderboard from "@/components/Leaderboard";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { balance } = useBalance();
  const { data: games } = useGameHistory({ limit: 10 });
  const { user } = useAuth();

  const stats = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      // In a real app, we'd fetch these from backend
      // For now, compute from game history
      if (!games) return {
        totalWinnings: 0,
        winRate: 0,
        gamesPlayed: 0,
        bestWin: 0
      };

      const gamesPlayed = games.length;
      const wins = games.filter(game => game.isWin);
      const winRate = gamesPlayed > 0 ? (wins.length / gamesPlayed * 100) : 0;
      
      const totalWinnings = wins.reduce((sum, game) => sum + game.payout, 0);
      const bestWin = wins.length > 0 
        ? Math.max(...wins.map(game => game.payout)) 
        : 0;

      return {
        totalWinnings,
        winRate: Math.round(winRate),
        gamesPlayed,
        bestWin
      };
    },
    enabled: !!games
  });

  return (
    <div className="slide-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-xl bg-card p-6 relative overflow-hidden gradient-border">
          <div className="relative z-10">
            <h2 className="font-accent font-bold text-2xl mb-3">Welcome Back, {user?.username}</h2>
            <p className="text-gray-300 mb-4">Ready to test your luck? Choose a game to start playing and win big!</p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-gray-400 text-sm">Total Winnings</p>
                <p className="font-semibold text-amber-400 text-xl">{stats.data?.totalWinnings ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="font-semibold text-secondary text-xl">{stats.data?.winRate ?? 0}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-gray-400 text-sm">Games Played</p>
                <p className="font-semibold text-white text-xl">{stats.data?.gamesPlayed ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-gray-400 text-sm">Best Win</p>
                <p className="font-semibold text-green-500 text-xl">{stats.data?.bestWin ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/2 opacity-10">
            <svg 
              viewBox="0 0 500 500" 
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full object-cover"
            >
              <circle cx="250" cy="250" r="200" fill="url(#grad1)" />
              <defs>
                <radialGradient id="grad1">
                  <stop offset="0%" stopColor="#6C63FF" />
                  <stop offset="100%" stopColor="#FF6B6B" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        {/* Leaderboard */}
        <div className="h-full">
          <Leaderboard />
        </div>
      </div>

      {/* Game Selection */}
      <h2 className="font-accent font-bold text-2xl mb-4">Choose a Game</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <GameCard
          title="Coin Toss Challenge"
          description="Heads or tails? Test your luck with a classic coin flip."
          path="/coin-toss"
          badgeText="Popular"
          badgeColor="bg-primary/80"
          gradientFrom="from-primary/20"
          gradientTo="to-secondary/20"
        />
        <GameCard
          title="Odd or Even"
          description="Predict if the number will be odd or even to win big!"
          path="/odd-even"
          badgeText="New"
          badgeColor="bg-secondary/80"
          gradientFrom="from-secondary/20"
          gradientTo="to-amber-500/20"
        />
      </div>

      {/* Recent Games History */}
      <h2 className="font-accent font-bold text-2xl mb-4">Recent Games</h2>
      <Card className="bg-card rounded-xl p-4 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">Game</th>
                  <th className="text-left py-3 px-4 text-gray-400">Bet</th>
                  <th className="text-left py-3 px-4 text-gray-400">Result</th>
                  <th className="text-right py-3 px-4 text-gray-400">Winnings</th>
                  <th className="text-right py-3 px-4 text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {games && games.length > 0 ? (
                  games.map((game) => (
                    <tr key={game.id} className="border-b border-gray-700/50 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {game.gameType === 'coin-toss' ? 'Coin Toss' : 'Odd/Even'}
                      </td>
                      <td className="py-3 px-4">
                        {game.playerChoice.charAt(0).toUpperCase() + game.playerChoice.slice(1)} - {game.betAmount}
                      </td>
                      <td className={`py-3 px-4 ${game.isWin ? 'text-green-500' : 'text-red-500'}`}>
                        {game.isWin ? 'Won' : 'Lost'}
                      </td>
                      <td className={`py-3 px-4 text-right ${game.isWin ? 'text-green-500' : 'text-red-500'}`}>
                        {game.isWin ? `+${game.payout}` : `-${game.betAmount}`}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        {formatDistanceToNow(new Date(game.playedAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No games played yet. Start playing to see your history!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

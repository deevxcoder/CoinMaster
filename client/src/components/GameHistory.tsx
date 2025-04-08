import { Card, CardContent } from "@/components/ui/card";
import { useGameHistory } from "@/hooks/use-game-history";
import { formatDistanceToNow } from "date-fns";
import { GameType } from "@shared/schema";

type GameHistoryProps = {
  type: GameType;
  showResult?: boolean;
};

export default function GameHistory({ type, showResult = false }: GameHistoryProps) {
  const { data: games, isLoading } = useGameHistory({ type });

  return (
    <Card className="bg-card rounded-xl p-5">
      <h3 className="font-accent font-semibold text-xl mb-4">Your History</h3>
      <CardContent className="p-0">
        <div className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar">
          {isLoading ? (
            <div className="flex-shrink-0 w-40 h-20 p-3 rounded-lg bg-muted animate-pulse"></div>
          ) : games && games.length > 0 ? (
            games.map((game) => (
              <div key={game.id} className="flex-shrink-0 w-40 p-3 rounded-lg bg-muted">
                <div className="flex justify-between items-center mb-2">
                  <div className={`
                    w-8 h-8 rounded-full 
                    ${type === 'coin-toss' 
                      ? (game.playerChoice === 'heads' 
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-600' 
                        : 'bg-gradient-to-br from-amber-500 to-yellow-700')
                      : (game.playerChoice === 'odd' 
                        ? 'bg-gradient-to-br from-secondary to-primary' 
                        : 'bg-gradient-to-br from-amber-400 to-amber-500')
                    } 
                    flex items-center justify-center font-bold
                  `}>
                    {type === 'coin-toss' 
                      ? (game.playerChoice === 'heads' ? 'H' : 'T')
                      : (game.playerChoice === 'odd' ? 'O' : 'E')
                    }
                  </div>
                  <span className={game.isWin ? 'text-green-500' : 'text-red-500'}>
                    {game.isWin ? `+${game.payout}` : `-${game.betAmount}`}
                  </span>
                </div>
                {showResult && (
                  <div className="text-sm text-gray-400">
                    Result: {game.result}
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(game.playedAt), { addSuffix: true })}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-3 text-gray-400">
              No history yet. Play your first game!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

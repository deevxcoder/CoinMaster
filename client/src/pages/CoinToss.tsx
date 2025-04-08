import { useState } from "react";
import { Link, useLocation } from "wouter";
import BetControls from "@/components/BetControls";
import { Coin } from "@/components/ui/coin";
import ResultModal from "@/components/ResultModal";
import GameHistory from "@/components/GameHistory";
import { useBalance } from "@/hooks/use-balance";
import { useGameHistory } from "@/hooks/use-game-history";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { playCoinToss } from "@/lib/games";
import { CoinSide, Game } from "@shared/schema";

export default function CoinToss() {
  const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastGame, setLastGame] = useState<Game | null>(null);
  const [_, setLocation] = useLocation();
  
  const { balance, updateBalance } = useBalance();
  const { refetch: refetchGameHistory } = useGameHistory({ type: 'coin-toss' });

  const tossCoinMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSide) throw new Error("Please select heads or tails");
      if (betAmount <= 0) throw new Error("Bet amount must be greater than 0");
      if (balance < betAmount) throw new Error("Insufficient balance");

      const gameResult = playCoinToss(selectedSide, betAmount);
      
      const response = await apiRequest('POST', '/api/games', gameResult);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setLastGame(data.game);
      updateBalance(data.balance);
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      refetchGameHistory();
    },
  });

  const handleTossCoin = async () => {
    if (!selectedSide) {
      alert("Please select heads or tails first!");
      return;
    }

    setIsFlipping(true);
    
    try {
      await tossCoinMutation.mutateAsync();
      
      // Wait for animation to complete before showing result
      setTimeout(() => {
        setIsFlipping(false);
        setShowResult(true);
      }, 2500);
    } catch (error) {
      setIsFlipping(false);
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    setSelectedSide(null);
  };

  return (
    <div className="fade-in">
      {/* Game Header */}
      <div className="flex items-center mb-6">
        <Link href="/">
          <button className="mr-3 p-2 rounded-full bg-muted hover:bg-opacity-80 transition-all">
            <i className="fas fa-arrow-left"></i>
          </button>
        </Link>
        <h2 className="font-accent font-bold text-2xl">Coin Toss Challenge</h2>
      </div>

      {/* Game Container */}
      <div className="bg-card rounded-xl p-6 mb-6 relative overflow-hidden gradient-border">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5"></div>
        
        {/* Game Content */}
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Coin Animation Area */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <Coin 
                side={lastGame?.result as CoinSide} 
                isFlipping={isFlipping} 
              />
              
              <div className="text-center mb-4 h-8 mt-6">
                {!isFlipping && !showResult && (
                  <p className="text-lg font-semibold text-gray-300">
                    Pick heads or tails and place your bet
                  </p>
                )}
              </div>
            </div>
            
            {/* Betting Controls */}
            <div className="flex-1">
              <BetControls
                type="coin-toss"
                selectedChoice={selectedSide}
                onSelectChoice={(choice) => setSelectedSide(choice as CoinSide)}
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                onSubmit={handleTossCoin}
                isSubmitting={isFlipping}
                disabled={showResult}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Game History */}
      <GameHistory type="coin-toss" />

      {/* Result Modal */}
      {showResult && lastGame && (
        <ResultModal
          isWin={lastGame.isWin}
          amount={lastGame.isWin ? lastGame.payout : lastGame.betAmount}
          message={`The coin landed on ${lastGame.result}`}
          onPlayAgain={handlePlayAgain}
          onCollect={() => {
            setShowResult(false);
            // Use setLocation instead of direct href to stay in SPA mode
            setLocation('/');
          }}
        />
      )}
    </div>
  );
}

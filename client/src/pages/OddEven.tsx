import { useState } from "react";
import { Link } from "wouter";
import BetControls from "@/components/BetControls";
import { Dice } from "@/components/ui/dice";
import ResultModal from "@/components/ResultModal";
import GameHistory from "@/components/GameHistory";
import { useBalance } from "@/hooks/use-balance";
import { useGameHistory } from "@/hooks/use-game-history";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { playOddEven } from "@/lib/games";
import { NumberParity, Game } from "@shared/schema";

export default function OddEven() {
  const [selectedParity, setSelectedParity] = useState<NumberParity | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastGame, setLastGame] = useState<Game | null>(null);
  
  const { balance, updateBalance } = useBalance();
  const { refetch: refetchGameHistory } = useGameHistory({ type: 'odd-even' });

  const rollDiceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedParity) throw new Error("Please select odd or even");
      if (betAmount <= 0) throw new Error("Bet amount must be greater than 0");
      if (balance < betAmount) throw new Error("Insufficient balance");

      const gameResult = playOddEven(selectedParity, betAmount);
      
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

  const handleRollDice = async () => {
    if (!selectedParity) {
      alert("Please select odd or even first!");
      return;
    }

    setIsRolling(true);
    
    try {
      await rollDiceMutation.mutateAsync();
      
      // Wait for animation to complete before showing result
      setTimeout(() => {
        setIsRolling(false);
        setShowResult(true);
      }, 1000);
    } catch (error) {
      setIsRolling(false);
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    setSelectedParity(null);
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
        <h2 className="font-accent font-bold text-2xl">Odd or Even Challenge</h2>
      </div>

      {/* Game Container */}
      <div className="bg-card rounded-xl p-6 mb-6 relative overflow-hidden gradient-border">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-secondary/5 to-amber-500/5"></div>
        
        {/* Game Content */}
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Dice Animation Area */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <Dice 
                value={lastGame ? parseInt(lastGame.result) : null} 
                isRolling={isRolling} 
              />
              
              <div className="text-center mb-4 h-8 mt-6">
                {!isRolling && !showResult && (
                  <p className="text-lg font-semibold text-gray-300">
                    Choose odd or even and place your bet
                  </p>
                )}
              </div>
            </div>
            
            {/* Betting Controls */}
            <div className="flex-1">
              <BetControls
                type="odd-even"
                selectedChoice={selectedParity}
                onSelectChoice={(choice) => setSelectedParity(choice as NumberParity)}
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                onSubmit={handleRollDice}
                isSubmitting={isRolling}
                disabled={showResult}
                buttonText="Roll Dice"
                buttonGradient="from-secondary to-amber-500"
                buttonTextColor="text-black"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Game History */}
      <GameHistory type="odd-even" showResult={true} />

      {/* Result Modal */}
      {showResult && lastGame && (
        <ResultModal
          isWin={lastGame.isWin}
          amount={lastGame.isWin ? lastGame.payout : lastGame.betAmount}
          message={`The dice rolled ${lastGame.result} (${parseInt(lastGame.result) % 2 === 0 ? 'Even' : 'Odd'})`}
          onPlayAgain={handlePlayAgain}
          onCollect={() => {
            setShowResult(false);
            window.location.href = '/';
          }}
        />
      )}
    </div>
  );
}

import { PlayerChoice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

type BetControlsProps = {
  type: 'coin-toss' | 'odd-even';
  selectedChoice: PlayerChoice | null;
  onSelectChoice: (choice: PlayerChoice) => void;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
  buttonText?: string;
  buttonGradient?: string;
  buttonTextColor?: string;
};

export default function BetControls({
  type,
  selectedChoice,
  onSelectChoice,
  betAmount,
  setBetAmount,
  onSubmit,
  isSubmitting,
  disabled = false,
  buttonText = type === 'coin-toss' ? 'Toss Coin' : 'Roll Dice',
  buttonGradient = type === 'coin-toss' ? 'from-primary to-secondary' : 'from-secondary to-accent',
  buttonTextColor = 'text-white'
}: BetControlsProps) {
  const isCoinToss = type === 'coin-toss';
  const choices = isCoinToss ? [
    { value: 'heads', label: 'Heads', icon: 'H' },
    { value: 'tails', label: 'Tails', icon: 'T' }
  ] : [
    { value: 'odd', label: 'Odd', icon: 'O' },
    { value: 'even', label: 'Even', icon: 'E' }
  ];

  const betChips = [10, 50, 100, 500];

  return (
    <div className="bg-muted rounded-xl p-5">
      <h3 className="font-accent font-semibold text-xl mb-4">Place Your Bet</h3>
      
      {/* Side Selection */}
      <div className="mb-5">
        <p className="text-gray-300 mb-2">{isCoinToss ? 'Choose Side:' : 'Predict Outcome:'}</p>
        <div className="flex gap-4">
          {choices.map((choice) => (
            <button
              key={choice.value}
              onClick={() => onSelectChoice(choice.value as PlayerChoice)}
              disabled={disabled || isSubmitting}
              className={`
                flex-1 py-3 px-4 rounded-lg border-2 
                ${selectedChoice === choice.value ? 'border-amber-400' : 'border-transparent hover:border-amber-400'} 
                transition-all bg-muted flex items-center justify-center
                ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              <span 
                className={`
                  w-8 h-8 rounded-full 
                  ${isCoinToss 
                    ? (choice.value === 'heads' 
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-600' 
                      : 'bg-gradient-to-br from-amber-500 to-yellow-700')
                    : (choice.value === 'odd' 
                      ? 'bg-gradient-to-br from-secondary to-primary' 
                      : 'bg-gradient-to-br from-amber-400 to-amber-500')
                  } 
                  mr-2 flex items-center justify-center font-bold
                `}
              >
                {choice.icon}
              </span>
              <span>{choice.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Bet Amount */}
      <div className="mb-5">
        <p className="text-gray-300 mb-2">Bet Amount:</p>
        <div className="flex gap-2 mb-3 flex-wrap">
          {betChips.map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={disabled || isSubmitting}
              className={`
                py-2 px-4 rounded-lg bg-muted 
                hover:bg-primary/20 transition-all
                ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              {amount}
            </button>
          ))}
        </div>
        <div className="relative">
          <Input 
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
            disabled={disabled || isSubmitting}
            className="w-full bg-dark p-3 rounded-lg text-white"
            placeholder="Enter bet amount"
          />
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm px-2 py-1 bg-primary rounded-md"
            onClick={() => setBetAmount(1000)}
            disabled={disabled || isSubmitting}
          >
            Max
          </button>
        </div>
      </div>
      
      {/* Odds */}
      <div className="mb-5">
        <div className="flex justify-between">
          <span className="text-gray-300">Odds:</span>
          <span className="font-semibold">2x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Potential Win:</span>
          <span className="font-semibold text-green-400">{betAmount * 2}</span>
        </div>
      </div>
      
      {/* Toss/Roll Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onSubmit}
          disabled={!selectedChoice || betAmount <= 0 || disabled || isSubmitting}
          className={`w-full py-3 rounded-lg bg-gradient-to-r ${buttonGradient} ${buttonTextColor} hover:opacity-90 transition-all font-semibold text-lg h-auto`}
        >
          {isSubmitting ? 
            (isCoinToss ? 'Tossing...' : 'Rolling...') : 
            buttonText
          }
        </Button>
      </motion.div>
    </div>
  );
}

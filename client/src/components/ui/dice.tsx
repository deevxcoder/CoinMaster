import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DiceProps = {
  value: number | null;
  isRolling: boolean;
};

export function Dice({ value, isRolling }: DiceProps) {
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setIsShaking(true);
      
      // Simulate dice rolling by changing values rapidly
      const interval = setInterval(() => {
        setCurrentValue(Math.floor(Math.random() * 6) + 1);
      }, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        setIsShaking(false);
        if (value !== null) {
          setCurrentValue(value);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (!isRolling && value !== null) {
      setCurrentValue(value);
    }
  }, [isRolling, value]);

  // Helper to render dice dots
  const renderDots = (num: number) => {
    switch (num) {
      case 1:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="w-4 h-4 rounded-full bg-black"></div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-6 p-4 h-full">
            <div className="w-4 h-4 rounded-full bg-black justify-self-start self-start"></div>
            <div className="w-4 h-4 rounded-full bg-black justify-self-end self-end"></div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-3 gap-1 p-3 h-full">
            <div className="w-4 h-4 rounded-full bg-black justify-self-start self-start"></div>
            <div className="w-4 h-4 rounded-full bg-black justify-self-center self-center"></div>
            <div className="w-4 h-4 rounded-full bg-black justify-self-end self-end"></div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 gap-6 p-4 h-full">
            <div className="w-4 h-4 rounded-full bg-black justify-self-start self-start"></div>
            <div className="w-4 h-4 rounded-full bg-black justify-self-end self-start"></div>
            <div className="w-4 h-4 rounded-full bg-black justify-self-start self-end"></div>
            <div className="w-4 h-4 rounded-full bg-black justify-self-end self-end"></div>
          </div>
        );
      case 5:
        return (
          <div className="grid grid-cols-3 gap-2 p-3 h-full">
            <div className="w-3 h-3 rounded-full bg-black justify-self-start self-start"></div>
            <div className="w-3 h-3 rounded-full bg-black justify-self-end self-start"></div>
            <div className="w-3 h-3 rounded-full bg-black justify-self-center self-center"></div>
            <div className="w-3 h-3 rounded-full bg-black justify-self-start self-end"></div>
            <div className="w-3 h-3 rounded-full bg-black justify-self-end self-end"></div>
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-2 gap-4 p-4 h-full">
            <div className="w-3 h-3 rounded-full bg-black justify-self-start self-start"></div>
            <div className="w-3 h-3 rounded-full bg-black justify-self-end self-start"></div>
            <div className="w-3 h-3 rounded-full bg-black justify-self-start self-center"></div>
            <div className="w-3 h-3 rounded-full bg-black justify-self-end self-center"></div>
            <div className="w-3 h-3 rounded-full bg-black justify-self-start self-end"></div>
            <div className="w-3 h-3 rounded-full bg-black justify-self-end self-end"></div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <span className="text-5xl font-bold text-black">?</span>
          </div>
        );
    }
  };

  return (
    <div className="relative mb-6 flex justify-center items-center">
      <motion.div
        animate={isShaking ? {
          rotate: [0, -10, 10, -10, 10, 0],
          x: [0, -5, 5, -5, 5, 0],
          y: [0, 5, -5, 5, -5, 0]
        } : {}}
        transition={{ duration: 0.5, repeat: isShaking ? Infinity : 0 }}
        className="w-32 h-32 relative"
      >
        <div className="w-full h-full rounded-xl bg-white shadow-lg">
          {currentValue ? renderDots(currentValue) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-5xl font-bold text-black">?</span>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {currentValue !== null && !isRolling && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-card border border-gray-700"
          >
            <span className="font-medium">
              {currentValue} ({currentValue % 2 === 0 ? 'Even' : 'Odd'})
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

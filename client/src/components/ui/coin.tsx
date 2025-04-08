import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CoinSide } from "@shared/schema";

type CoinProps = {
  side?: CoinSide;
  isFlipping: boolean;
};

export function Coin({ side = "heads", isFlipping }: CoinProps) {
  const [rotation, setRotation] = useState(0);
  const [finalSide, setFinalSide] = useState<CoinSide | null>(null);

  useEffect(() => {
    if (isFlipping) {
      const flips = 5 + Math.floor(Math.random() * 5); // 5-10 flips
      const interval = setInterval(() => {
        setRotation(prev => prev + 180);
      }, 300);

      setTimeout(() => {
        clearInterval(interval);
        setFinalSide(side);
      }, flips * 300);

      return () => clearInterval(interval);
    } else if (!isFlipping && side) {
      setFinalSide(side);
      setRotation(side === "heads" ? 0 : 180);
    }
  }, [isFlipping, side]);

  return (
    <div className="relative w-48 h-48 mb-6 perspective-1000">
      <div 
        className="w-48 h-48 relative transform-style-preserve-3d transition-all duration-300"
        style={{ transform: `rotateY(${rotation}deg)` }}
      >
        {/* Heads Side */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 backface-visibility-hidden shadow-lg flex items-center justify-center">
          <div className="w-[90%] h-[90%] rounded-full border-4 border-yellow-300 flex items-center justify-center">
            <span className="text-4xl font-bold text-yellow-800">H</span>
          </div>
        </div>
        
        {/* Tails Side */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500 to-yellow-700 shadow-lg flex items-center justify-center"
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
        >
          <div className="w-[90%] h-[90%] rounded-full border-4 border-yellow-300 flex items-center justify-center">
            <span className="text-4xl font-bold text-yellow-800">T</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {finalSide && !isFlipping && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-card border border-gray-700"
          >
            <span className="font-medium">
              {finalSide === "heads" ? "Heads" : "Tails"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

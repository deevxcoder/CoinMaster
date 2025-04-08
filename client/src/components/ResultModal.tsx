import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type ResultModalProps = {
  isWin: boolean;
  amount: number;
  message: string;
  onPlayAgain: () => void;
  onCollect: () => void;
};

export default function ResultModal({
  isWin,
  amount,
  message,
  onPlayAgain,
  onCollect
}: ResultModalProps) {
  return (
    <Dialog defaultOpen={true}>
      <DialogContent className="w-[90%] max-w-md bg-card rounded-xl p-6 shadow-lg border border-gray-700">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-6"
          >
            {isWin ? (
              /* Win result */
              <>
                <motion.div 
                  className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                  initial={{ rotate: -10 }}
                  animate={{ rotate: [0, 20, 0, 20, 0] }}
                  transition={{ duration: 1, delay: 0.2 }}
                >
                  <i className="fas fa-trophy text-4xl text-amber-400"></i>
                </motion.div>
                <h3 className="font-accent font-bold text-2xl mb-2 text-amber-400">You Won!</h3>
                <motion.p 
                  className="text-3xl font-bold mb-4"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  +{amount}
                </motion.p>
                <p className="text-gray-300 mb-6">{message}</p>
              </>
            ) : (
              /* Lose result */
              <>
                <motion.div 
                  className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 0.9, 1, 0.9, 1] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <i className="fas fa-times text-4xl text-red-500"></i>
                </motion.div>
                <h3 className="font-accent font-bold text-2xl mb-2 text-red-500">You Lost!</h3>
                <motion.p 
                  className="text-3xl font-bold mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  -{amount}
                </motion.p>
                <p className="text-gray-300 mb-6">{message}</p>
              </>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onPlayAgain}
                className="py-3 rounded-lg bg-primary hover:bg-opacity-80 transition-all font-semibold"
              >
                {isWin ? 'Play Again' : 'Try Again'}
              </Button>
              <Button
                onClick={onCollect}
                className={`py-3 rounded-lg ${isWin ? 'bg-amber-400 text-black' : 'bg-muted'} hover:bg-opacity-80 transition-all font-semibold`}
              >
                {isWin ? 'Collect' : 'Back Home'}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

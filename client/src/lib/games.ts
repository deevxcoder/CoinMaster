import { InsertGame, CoinSide, NumberParity } from "@shared/schema";

/**
 * Play a coin toss game
 * @param playerChoice The side the player chose (heads/tails)
 * @param betAmount Amount of coins bet
 * @returns Game data to be sent to the API
 */
export function playCoinToss(playerChoice: CoinSide, betAmount: number): InsertGame {
  // Randomly determine the result
  const result: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
  
  // Check if player won
  const isWin = playerChoice === result;
  
  // Calculate payout (2x for a win)
  const payout = isWin ? betAmount * 2 : 0;
  
  // Return game data
  return {
    userId: 1, // We're using a default user
    gameType: 'coin-toss',
    betAmount,
    playerChoice,
    result,
    isWin,
    payout
  };
}

/**
 * Play an odd/even game
 * @param playerChoice The parity the player chose (odd/even)
 * @param betAmount Amount of coins bet
 * @returns Game data to be sent to the API
 */
export function playOddEven(playerChoice: NumberParity, betAmount: number): InsertGame {
  // Generate a random number between 1 and 6
  const diceResult = Math.floor(Math.random() * 6) + 1;
  
  // Determine if result is odd or even
  const resultParity: NumberParity = diceResult % 2 === 0 ? 'even' : 'odd';
  
  // Check if player won
  const isWin = playerChoice === resultParity;
  
  // Calculate payout (2x for a win)
  const payout = isWin ? betAmount * 2 : 0;
  
  // Return game data
  return {
    userId: 1, // We're using a default user
    gameType: 'odd-even',
    betAmount,
    playerChoice,
    result: diceResult.toString(), // Store the actual number rolled
    isWin,
    payout
  };
}

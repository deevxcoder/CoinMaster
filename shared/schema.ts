import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: integer("balance").notNull().default(1500),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Game schema
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameType: text("game_type").notNull(), // 'coin-toss' or 'odd-even'
  betAmount: integer("bet_amount").notNull(),
  playerChoice: text("player_choice").notNull(), // 'heads', 'tails', 'odd', 'even'
  result: text("result").notNull(), // actual result: 'heads', 'tails', or number 1-6
  isWin: boolean("is_win").notNull(),
  payout: integer("payout").notNull(),
  playedAt: timestamp("played_at").notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true, 
  playedAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

// Game-specific types
export type GameType = 'coin-toss' | 'odd-even';
export type CoinSide = 'heads' | 'tails';
export type NumberParity = 'odd' | 'even';
export type PlayerChoice = CoinSide | NumberParity;

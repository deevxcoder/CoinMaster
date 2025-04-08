import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User account status enum
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'banned']);

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: integer("balance").notNull().default(1500),
  isAdmin: boolean("is_admin").notNull().default(false),
  status: userStatusEnum("status").notNull().default('active'),
  notes: text("notes"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

// Define deposit status enum
export const depositStatusEnum = pgEnum('deposit_status', ['pending', 'approved', 'rejected']);

// Define deposit table
export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  method: text("method").notNull(), // 'upi', 'bank_transfer', 'cash'
  proofInfo: text("proof_info").notNull(),
  hasProofFile: boolean("has_proof_file").notNull().default(false),
  proofFileUrl: text("proof_file_url"),
  status: depositStatusEnum("status").notNull().default('pending'),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDepositSchema = createInsertSchema(deposits).omit({
  id: true,
  userId: true,
  proofFileUrl: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;

// Game-specific types
export type GameType = 'coin-toss' | 'odd-even';
export type CoinSide = 'heads' | 'tails';
export type NumberParity = 'odd' | 'even';
export type PlayerChoice = CoinSide | NumberParity;

// Payment types
export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash';
export type DepositStatus = 'pending' | 'approved' | 'rejected';

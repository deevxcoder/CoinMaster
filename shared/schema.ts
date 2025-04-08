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

// Risk Management Types
export const riskSettingsTypes = pgEnum('risk_settings_type', ['global', 'game', 'user']);

// Risk Management Settings table
export const riskSettings = pgTable("risk_settings", {
  id: serial("id").primaryKey(),
  type: riskSettingsTypes("type").notNull(),
  gameType: text("game_type"), // Only set for game-specific settings
  userId: integer("user_id"), // Only set for user-specific settings
  maxBetAmount: integer("max_bet_amount").notNull(),
  dailyLossLimit: integer("daily_loss_limit"),
  weeklyLossLimit: integer("weekly_loss_limit"),
  monthlyLossLimit: integer("monthly_loss_limit"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRiskSettingsSchema = createInsertSchema(riskSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RiskSettings = typeof riskSettings.$inferSelect;
export type InsertRiskSettings = z.infer<typeof insertRiskSettingsSchema>;

// Fraud Detection
export const activityLogTypeEnum = pgEnum('activity_log_type', ['login', 'game_play', 'deposit', 'withdrawal', 'profile_update']);
export const suspiciousActivityReasonEnum = pgEnum('suspicious_activity_reason', ['multi_account', 'unusual_pattern', 'ip_change', 'bet_pattern', 'other']);

// Activity logs for tracking user actions
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: activityLogTypeEnum("type").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Suspicious activity flags
export const suspiciousActivities = pgTable("suspicious_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  reason: suspiciousActivityReasonEnum("reason").notNull(),
  details: text("details").notNull(),
  isResolved: boolean("is_resolved").notNull().default(false),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSuspiciousActivitySchema = createInsertSchema(suspiciousActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type SuspiciousActivity = typeof suspiciousActivities.$inferSelect;
export type InsertSuspiciousActivity = z.infer<typeof insertSuspiciousActivitySchema>;

// Platform Analytics
export const analyticPeriodEnum = pgEnum('analytic_period', ['daily', 'weekly', 'monthly']);

// Game metrics for analytics
export const gameMetrics = pgTable("game_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  gameType: text("game_type").notNull(),
  totalBets: integer("total_bets").notNull().default(0),
  totalWagers: integer("total_wagers").notNull().default(0),
  totalPayouts: integer("total_payouts").notNull().default(0),
  uniquePlayers: integer("unique_players").notNull().default(0),
  period: analyticPeriodEnum("period").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Financial metrics
export const financialMetrics = pgTable("financial_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalDeposits: integer("total_deposits").notNull().default(0),
  totalDepositAmount: integer("total_deposit_amount").notNull().default(0),
  totalWithdrawals: integer("total_withdrawals").notNull().default(0),
  totalWithdrawalAmount: integer("total_withdrawal_amount").notNull().default(0),
  netRevenue: integer("net_revenue").notNull().default(0),
  period: analyticPeriodEnum("period").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User metrics
export const userMetrics = pgTable("user_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  newUsers: integer("new_users").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  retentionRate: integer("retention_rate").notNull().default(0), // Stored as percentage * 100
  churnRate: integer("churn_rate").notNull().default(0), // Stored as percentage * 100
  avgSessionTime: integer("avg_session_time").notNull().default(0), // In seconds
  period: analyticPeriodEnum("period").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GameMetrics = typeof gameMetrics.$inferSelect;
export type FinancialMetrics = typeof financialMetrics.$inferSelect;
export type UserMetrics = typeof userMetrics.$inferSelect;

// Game Management
export const gameConfigStatusEnum = pgEnum('game_config_status', ['active', 'disabled', 'maintenance', 'testing']);

// Game configurations
export const gameConfigurations = pgTable("game_configurations", {
  id: serial("id").primaryKey(),
  gameType: text("game_type").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  minBet: integer("min_bet").notNull().default(10),
  maxBet: integer("max_bet").notNull().default(1000),
  houseEdge: integer("house_edge").notNull().default(200), // Stored as percentage * 100 (e.g., 2% = 200)
  payoutMultiplier: integer("payout_multiplier").notNull().default(200), // e.g., 2x = 200
  status: gameConfigStatusEnum("status").notNull().default('active'),
  customSettings: text("custom_settings"), // JSON string for game-specific settings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGameConfigurationSchema = createInsertSchema(gameConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GameConfiguration = typeof gameConfigurations.$inferSelect;
export type InsertGameConfiguration = z.infer<typeof insertGameConfigurationSchema>;

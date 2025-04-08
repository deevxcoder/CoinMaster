import { 
  users, games, deposits,
  type User, type InsertUser, 
  type Game, type InsertGame,
  type Deposit, type InsertDeposit,
  type InsertRiskSettings, type RiskSettings,
  type InsertActivityLog, type ActivityLog,
  type InsertSuspiciousActivity, type SuspiciousActivity,
  type GameConfiguration, type InsertGameConfiguration
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<User>;
  getTopUsers(limit: number): Promise<User[]>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGamesByUser(userId: number): Promise<Game[]>;
  getGamesByUserAndType(userId: number, gameType: string): Promise<Game[]>;
  getRecentGames(userId: number, limit: number): Promise<Game[]>;
  
  // Deposit operations
  createDeposit(userId: number, deposit: InsertDeposit): Promise<Deposit>;
  getDepositsByUser(userId: number): Promise<Deposit[]>;
  getDepositById(id: number): Promise<Deposit | undefined>;
  updateDepositStatus(id: number, status: string, adminNotes?: string): Promise<Deposit>;
  
  // Risk Management
  createRiskSettings(settings: InsertRiskSettings): Promise<RiskSettings | any>;
  getRiskSettings(type: string, gameType?: string, userId?: number): Promise<RiskSettings[] | any[]>;
  updateRiskSettings(id: number, settings: Partial<RiskSettings>): Promise<RiskSettings | any>;
  
  // Activity Tracking
  logActivity(userId: number, type: string, ipAddress?: string, userAgent?: string, details?: string): Promise<ActivityLog | any>;
  flagSuspiciousActivity(userId: number, reason: string, details: string): Promise<SuspiciousActivity | any>;
  resolveSuspiciousActivity(id: number, adminNotes?: string): Promise<SuspiciousActivity | any>;
  
  // Game Management
  getGameConfiguration(gameType: string): Promise<GameConfiguration | any>;
  getAllGameConfigurations(): Promise<GameConfiguration[] | any[]>;
  createOrUpdateGameConfiguration(gameType: string, config: InsertGameConfiguration): Promise<GameConfiguration | any>;
  
  // Analytics
  getGameMetrics(period: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  getFinancialMetrics(period: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  getUserMetrics(period: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  
  // Session store
  sessionStore: session.Store;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user;
  }
  
  async getTopUsers(limit: number): Promise<User[]> {
    return db
      .select()
      .from(users)
      .orderBy(desc(users.balance))
      .limit(limit);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    
    // Update user balance
    const [user] = await db.select().from(users).where(eq(users.id, insertGame.userId));
    
    if (!user) {
      throw new Error(`User with ID ${insertGame.userId} not found`);
    }
    
    let newBalance = user.balance;
    if (game.isWin) {
      newBalance += game.payout;
    } else {
      newBalance -= game.betAmount;
    }
    
    await this.updateUserBalance(user.id, newBalance);
    
    return game;
  }

  async getGamesByUser(userId: number): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.playedAt));
  }

  async getGamesByUserAndType(userId: number, gameType: string): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(
        and(
          eq(games.userId, userId),
          eq(games.gameType, gameType)
        )
      )
      .orderBy(desc(games.playedAt));
  }

  async getRecentGames(userId: number, limit: number): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.playedAt))
      .limit(limit);
  }
  
  async createDeposit(userId: number, depositData: InsertDeposit): Promise<Deposit> {
    const deposit = {
      ...depositData,
      userId,
    };
    
    const [createdDeposit] = await db
      .insert(deposits)
      .values(deposit)
      .returning();
      
    return createdDeposit;
  }
  
  async getDepositsByUser(userId: number): Promise<Deposit[]> {
    return db
      .select()
      .from(deposits)
      .where(eq(deposits.userId, userId))
      .orderBy(desc(deposits.createdAt));
  }
  
  async getDepositById(id: number): Promise<Deposit | undefined> {
    const [deposit] = await db
      .select()
      .from(deposits)
      .where(eq(deposits.id, id));
      
    return deposit;
  }
  
  async updateDepositStatus(id: number, status: string, adminNotes?: string): Promise<Deposit> {
    const updateData: any = { status };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    const [deposit] = await db
      .update(deposits)
      .set(updateData)
      .where(eq(deposits.id, id))
      .returning();
      
    // If the deposit is approved, add the amount to the user's balance
    if (status === 'approved') {
      const depositRecord = await this.getDepositById(id);
      if (depositRecord) {
        const user = await this.getUser(depositRecord.userId);
        if (user) {
          const newBalance = user.balance + depositRecord.amount;
          await this.updateUserBalance(user.id, newBalance);
        }
      }
    }
    
    return deposit;
  }
  
  // Risk Management Methods
  async createRiskSettings(settings: InsertRiskSettings): Promise<any> {
    // Stub implementation until tables are created via migrations
    console.log("Creating risk settings:", settings);
    return { id: 1, ...settings, createdAt: new Date(), updatedAt: new Date() };
  }

  async getRiskSettings(type: string, gameType?: string, userId?: number): Promise<any[]> {
    // Stub implementation until tables are created via migrations
    console.log("Getting risk settings:", { type, gameType, userId });
    return [{
      id: 1,
      type: type,
      gameType: gameType || 'coin-toss',
      userId: userId || null,
      maxBetAmount: 1000,
      dailyLossLimit: 2000,
      weeklyLossLimit: 5000,
      monthlyLossLimit: 10000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }];
  }

  async updateRiskSettings(id: number, settings: any): Promise<any> {
    // Stub implementation until tables are created via migrations
    console.log("Updating risk settings:", { id, ...settings });
    return { 
      id, 
      ...settings, 
      updatedAt: new Date() 
    };
  }

  // Activity Tracking Methods
  async logActivity(userId: number, type: string, ipAddress?: string, userAgent?: string, details?: string): Promise<any> {
    // Stub implementation until tables are created via migrations
    console.log("Logging activity:", { userId, type, ipAddress, userAgent, details });
    return { 
      id: 1, 
      userId, 
      type, 
      ipAddress, 
      userAgent, 
      details, 
      createdAt: new Date() 
    };
  }

  async flagSuspiciousActivity(userId: number, reason: string, details: string): Promise<any> {
    // Stub implementation until tables are created via migrations
    console.log("Flagging suspicious activity:", { userId, reason, details });
    return { 
      id: 1, 
      userId, 
      reason, 
      details, 
      isResolved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async resolveSuspiciousActivity(id: number, adminNotes?: string): Promise<any> {
    // Stub implementation until tables are created via migrations
    console.log("Resolving suspicious activity:", { id, adminNotes });
    return { 
      id, 
      isResolved: true,
      adminNotes,
      resolvedAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Game Configuration Methods
  async getGameConfiguration(gameType: string): Promise<any> {
    // Stub implementation until tables are created via migrations
    console.log("Getting game configuration:", gameType);
    
    // Default configurations for existing games
    if (gameType === 'coin-toss') {
      return {
        id: 1,
        gameType: 'coin-toss',
        displayName: 'Coin Toss',
        description: 'Guess the outcome of a coin toss - heads or tails.',
        minBet: 10,
        maxBet: 1000,
        houseEdge: 200, // 2%
        payoutMultiplier: 200, // 2x
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else if (gameType === 'odd-even') {
      return {
        id: 2,
        gameType: 'odd-even',
        displayName: 'Odd or Even',
        description: 'Predict whether the dice roll will be odd or even.',
        minBet: 10,
        maxBet: 1000,
        houseEdge: 200, // 2%
        payoutMultiplier: 200, // 2x
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    return null;
  }

  async getAllGameConfigurations(): Promise<any[]> {
    // Stub implementation until tables are created via migrations
    console.log("Getting all game configurations");
    return [
      {
        id: 1,
        gameType: 'coin-toss',
        displayName: 'Coin Toss',
        description: 'Guess the outcome of a coin toss - heads or tails.',
        minBet: 10,
        maxBet: 1000,
        houseEdge: 200, // 2%
        payoutMultiplier: 200, // 2x
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        gameType: 'odd-even',
        displayName: 'Odd or Even',
        description: 'Predict whether the dice roll will be odd or even.',
        minBet: 10,
        maxBet: 1000,
        houseEdge: 200, // 2%
        payoutMultiplier: 200, // 2x
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async createOrUpdateGameConfiguration(gameType: string, config: any): Promise<any> {
    // Stub implementation until tables are created via migrations
    console.log("Creating/updating game configuration:", { gameType, ...config });
    return { 
      id: gameType === 'coin-toss' ? 1 : 2, 
      gameType, 
      ...config, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
  }

  // Analytics Methods
  async getGameMetrics(period: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Stub implementation until tables are created via migrations
    console.log("Getting game metrics:", { period, startDate, endDate });
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      {
        id: 1,
        date: yesterday,
        gameType: 'coin-toss',
        totalBets: 120,
        totalWagers: 12000,
        totalPayouts: 11500,
        uniquePlayers: 45,
        period: period,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 2,
        date: yesterday,
        gameType: 'odd-even',
        totalBets: 85,
        totalWagers: 8500,
        totalPayouts: 8200,
        uniquePlayers: 32,
        period: period,
        createdAt: today,
        updatedAt: today
      }
    ];
  }

  async getFinancialMetrics(period: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Stub implementation until tables are created via migrations
    console.log("Getting financial metrics:", { period, startDate, endDate });
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      {
        id: 1,
        date: yesterday,
        totalDeposits: 25,
        totalDepositAmount: 15000,
        totalWithdrawals: 10,
        totalWithdrawalAmount: 8000,
        netRevenue: 800,
        period: period,
        createdAt: today,
        updatedAt: today
      }
    ];
  }

  async getUserMetrics(period: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Stub implementation until tables are created via migrations
    console.log("Getting user metrics:", { period, startDate, endDate });
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      {
        id: 1,
        date: yesterday,
        newUsers: 12,
        activeUsers: 65,
        retentionRate: 8500, // 85%
        churnRate: 1500, // 15%
        avgSessionTime: 780, // 13 minutes
        period: period,
        createdAt: today,
        updatedAt: today
      }
    ];
  }
}

export const storage = new DatabaseStorage();

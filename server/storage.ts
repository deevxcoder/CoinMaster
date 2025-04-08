import { 
  users, games, deposits,
  type User, type InsertUser, 
  type Game, type InsertGame,
  type Deposit, type InsertDeposit
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
}

export const storage = new DatabaseStorage();

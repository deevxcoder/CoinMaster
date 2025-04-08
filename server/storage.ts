import { 
  users, games, 
  type User, type InsertUser, 
  type Game, type InsertGame
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<User>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGamesByUser(userId: number): Promise<Game[]>;
  getGamesByUserAndType(userId: number, gameType: string): Promise<Game[]>;
  getRecentGames(userId: number, limit: number): Promise<Game[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private userIdCounter: number;
  private gameIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    
    // Create a default user for testing
    this.createUser({
      username: "player1",
      password: "password"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, balance: 1500 };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    const updatedUser = { ...user, balance: newBalance };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Game operations
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.gameIdCounter++;
    const now = new Date();
    const game: Game = { ...insertGame, id, playedAt: now };
    this.games.set(id, game);
    return game;
  }

  async getGamesByUser(userId: number): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.userId === userId)
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
  }

  async getGamesByUserAndType(userId: number, gameType: string): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.userId === userId && game.gameType === gameType)
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
  }

  async getRecentGames(userId: number, limit: number): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.userId === userId)
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();

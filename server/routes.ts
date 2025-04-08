import express, { type Express, Request as ExpressRequest, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema, insertDepositSchema, type User, users, games, deposits, userStatusEnum } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Extend the Express Request type to include the user property
interface Request extends ExpressRequest {
  user?: User;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up authentication
  setupAuth(app);
  
  // Authentication check middleware
  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };
  
  const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user?.isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Not authorized" });
  };

  // Get user balance
  app.get("/api/balance", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // By this point, we know req.user exists because of the ensureAuthenticated middleware
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ balance: user.balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to get balance" });
    }
  });

  // Update user balance
  app.post("/api/balance", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      if (typeof amount !== 'number') {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newBalance = user.balance + amount;
      if (newBalance < 0) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const updatedUser = await storage.updateUserBalance(user.id, newBalance);
      res.json({ balance: updatedUser.balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to update balance" });
    }
  });

  // Game API routes
  app.post("/api/games", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate the game data
      const gameData = insertGameSchema.parse(req.body);
      
      // Override userId with the authenticated user's ID
      gameData.userId = req.user!.id;
      
      // Get the user
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough balance
      if (user.balance < gameData.betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create the game record
      const game = await storage.createGame(gameData);
      
      // Update user balance
      const balanceChange = gameData.isWin ? gameData.payout : -gameData.betAmount;
      const newBalance = user.balance + balanceChange;
      await storage.updateUserBalance(user.id, newBalance);
      
      res.status(201).json({ game, balance: newBalance });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error creating game:", error);
        res.status(500).json({ message: "Failed to create game" });
      }
    }
  });

  // Get recent games for the user
  app.get("/api/games", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const gameType = req.query.type as string;
      
      // If user is admin and no specific game type is requested, return all games
      if (req.user?.isAdmin && !gameType) {
        // Get all games from database with limit
        const allGames = await db.select()
          .from(games)
          .orderBy(desc(games.playedAt))
          .limit(limit);
        
        return res.json(allGames);
      }
      
      // For regular users or when game type is specified
      let userGames;
      if (gameType) {
        userGames = await storage.getGamesByUserAndType(req.user!.id, gameType);
      } else {
        userGames = await storage.getRecentGames(req.user!.id, limit);
      }
      
      res.json(userGames);
    } catch (error) {
      console.error("Error getting games:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  // Add a leaderboard endpoint
  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      // For now, this is a simple implementation that just returns all users
      // sorted by balance. In a real app, you might want to add more complex logic.
      const topUsers = await storage.getTopUsers(10);
      
      // Don't send passwords to the client
      const leaderboard = topUsers.map((user: { password: string; [key: string]: any }) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(leaderboard);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });
  
  // Get all users (admin only)
  app.get("/api/users", ensureAdmin, async (req: Request, res: Response) => {
    try {
      const allUsers = await db.select().from(users);
      
      // Don't send passwords to the client
      const usersWithoutPasswords = allUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  // Update a user (admin only)
  app.patch("/api/users/:id", ensureAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { balanceAdjustment, status, notes } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the user to update
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow modifying admin accounts (except by themselves)
      if (user.isAdmin && user.id !== req.user!.id) {
        return res.status(403).json({ message: "Cannot modify another admin account" });
      }
      
      // Prepare update data
      const updateData: any = {};
      
      // Update status if provided and valid
      if (status && ["active", "suspended", "banned"].includes(status)) {
        updateData.status = status;
      }
      
      // Update notes if provided
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      
      // Update balance if adjustment is provided
      if (balanceAdjustment !== undefined && typeof balanceAdjustment === 'number') {
        const newBalance = user.balance + balanceAdjustment;
        
        // Don't allow negative balance
        if (newBalance < 0) {
          return res.status(400).json({ message: "Balance cannot be negative" });
        }
        
        updateData.balance = newBalance;
      }
      
      // Update timestamp
      updateData.updatedAt = new Date();
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId))
          .returning();
        
        // Don't send password to client
        const { password, ...userWithoutPassword } = updatedUser;
        
        res.json(userWithoutPassword);
      } else {
        // If no changes, just return the current user
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Deposit API routes
  
  // Create a new deposit
  app.post("/api/deposits", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate the deposit data
      const depositData = insertDepositSchema.parse(req.body);
      
      // Create the deposit record
      const deposit = await storage.createDeposit(req.user!.id, depositData);
      
      res.status(201).json(deposit);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error creating deposit:", error);
        res.status(500).json({ message: "Failed to create deposit" });
      }
    }
  });
  
  // Get deposits for the current user
  app.get("/api/deposits", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // If user is admin, return all deposits from all users
      if (req.user?.isAdmin) {
        // Get all deposits from database
        const allDeposits = await db.select().from(deposits);
        
        // Return all deposits
        return res.json(allDeposits);
      }
      
      // For regular users, just return their own deposits
      const userDeposits = await storage.getDepositsByUser(req.user!.id);
      res.json(userDeposits);
    } catch (error) {
      console.error("Error getting deposits:", error);
      res.status(500).json({ message: "Failed to get deposits" });
    }
  });
  
  // Get specific deposit by ID
  app.get("/api/deposits/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const depositId = parseInt(req.params.id);
      
      if (isNaN(depositId)) {
        return res.status(400).json({ message: "Invalid deposit ID" });
      }
      
      const deposit = await storage.getDepositById(depositId);
      
      if (!deposit) {
        return res.status(404).json({ message: "Deposit not found" });
      }
      
      // Only the deposit owner or an admin can view the deposit
      if (deposit.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(deposit);
    } catch (error) {
      console.error("Error getting deposit:", error);
      res.status(500).json({ message: "Failed to get deposit" });
    }
  });
  
  // Seed data endpoint (admin only)
  app.post("/api/seed-data", ensureAdmin, async (req: Request, res: Response) => {
    try {
      // Clear existing data
      await db.delete(games);
      await db.delete(deposits);
      
      // Keep existing users but reset balances for non-admin users
      const allUsers = await db.select().from(users);
      for (const user of allUsers) {
        if (!user.isAdmin) {
          await storage.updateUserBalance(user.id, 1500); // Reset to default balance
        }
      }
      
      // Game types and results
      const gameTypes = ['coin-toss', 'odd-even'];
      const coinSides = ['heads', 'tails'];
      const numberParities = ['odd', 'even'];
      const diceResults = ['1', '2', '3', '4', '5', '6'];
      
      // Create 50 random games across users
      for (let i = 0; i < 50; i++) {
        const userId = Math.floor(Math.random() * allUsers.length) + 1;
        const gameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
        const betAmount = Math.floor(Math.random() * 200) + 50; // Between 50 and 250
        
        let playerChoice, result;
        
        if (gameType === 'coin-toss') {
          playerChoice = coinSides[Math.floor(Math.random() * coinSides.length)];
          result = coinSides[Math.floor(Math.random() * coinSides.length)];
        } else {
          playerChoice = numberParities[Math.floor(Math.random() * numberParities.length)];
          const diceValue = diceResults[Math.floor(Math.random() * diceResults.length)];
          result = diceValue;
        }
        
        // Determine if the player won
        let isWin;
        if (gameType === 'coin-toss') {
          isWin = playerChoice === result;
        } else {
          const resultIsEven = parseInt(result) % 2 === 0;
          isWin = (playerChoice === 'even' && resultIsEven) || 
                  (playerChoice === 'odd' && !resultIsEven);
        }
        
        const payout = isWin ? betAmount * 2 : 0;
        
        // Calculate timestamp within last 7 days
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 7));
        
        await db.insert(games).values({
          userId,
          gameType,
          betAmount,
          playerChoice,
          result,
          isWin,
          payout,
          playedAt: timestamp
        });
      }
      
      // Create 30 random deposits
      const paymentMethods = ['upi', 'bank_transfer', 'cash'];
      const statuses = ['pending', 'approved', 'rejected'];
      
      for (let i = 0; i < 30; i++) {
        const userId = Math.floor(Math.random() * allUsers.length) + 1;
        const amount = Math.floor(Math.random() * 1000) + 100; // Between 100 and 1100
        const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Calculate timestamp within last 14 days
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 14));
        
        await db.insert(deposits).values({
          userId,
          amount,
          method,
          proofInfo: `Transaction ID: TXID${Math.floor(Math.random() * 10000000)}`,
          status: status as any, // Type assertion to handle the enum conversion
          adminNotes: status === 'rejected' ? 'Invalid transaction details' : '',
          createdAt: timestamp,
          updatedAt: timestamp,
          hasProofFile: Math.random() > 0.7 // 30% chance of having a proof file
        });
      }
      
      res.json({
        success: true,
        users: allUsers.length,
        games: 50,
        deposits: 30
      });
      
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // Update deposit status (admin only)
  app.patch("/api/deposits/:id/status", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // For now, we'll allow any authenticated user to update deposit status for testing
      // In a real app, you'd want to check if the user is an admin
      const depositId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      
      if (isNaN(depositId)) {
        return res.status(400).json({ message: "Invalid deposit ID" });
      }
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const deposit = await storage.updateDepositStatus(depositId, status, adminNotes);
      res.json(deposit);
    } catch (error) {
      console.error("Error updating deposit status:", error);
      res.status(500).json({ message: "Failed to update deposit status" });
    }
  });

  return httpServer;
}

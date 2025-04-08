import express, { type Express, Request as ExpressRequest, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema, insertDepositSchema, type User } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";

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
      
      let games;
      if (gameType) {
        games = await storage.getGamesByUserAndType(req.user!.id, gameType);
      } else {
        games = await storage.getRecentGames(req.user!.id, limit);
      }
      
      res.json(games);
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
      const deposits = await storage.getDepositsByUser(req.user!.id);
      res.json(deposits);
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

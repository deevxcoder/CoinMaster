import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Session/Auth API routes - for simplicity, we're using default user
  app.get("/api/session", async (req: Request, res: Response) => {
    try {
      const defaultUser = await storage.getUserByUsername("player1");
      res.json(defaultUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  // Get user balance
  app.get("/api/balance", async (req: Request, res: Response) => {
    try {
      const defaultUser = await storage.getUserByUsername("player1");
      if (!defaultUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ balance: defaultUser.balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to get balance" });
    }
  });

  // Update user balance
  app.post("/api/balance", async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      if (typeof amount !== 'number') {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const defaultUser = await storage.getUserByUsername("player1");
      if (!defaultUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newBalance = defaultUser.balance + amount;
      if (newBalance < 0) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const updatedUser = await storage.updateUserBalance(defaultUser.id, newBalance);
      res.json({ balance: updatedUser.balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to update balance" });
    }
  });

  // Game API routes
  app.post("/api/games", async (req: Request, res: Response) => {
    try {
      // Validate the game data
      const gameData = insertGameSchema.parse(req.body);
      
      // Get the default user for now
      const user = await storage.getUserByUsername("player1");
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
  app.get("/api/games", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const gameType = req.query.type as string;
      
      const user = await storage.getUserByUsername("player1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let games;
      if (gameType) {
        games = await storage.getGamesByUserAndType(user.id, gameType);
      } else {
        games = await storage.getRecentGames(user.id, limit);
      }
      
      res.json(games);
    } catch (error) {
      console.error("Error getting games:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  return httpServer;
}

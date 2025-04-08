import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users, type User } from "@shared/schema";
import { eq } from "drizzle-orm";

// Extend Express.User interface for TypeScript
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password: string;
      balance: number;
      isAdmin: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "casino-games-secret",
    resave: false,
    saveUninitialized: false,
    store: undefined, // This will be set by storage.ts
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username: string, password: string, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username));

        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, req.body.username));

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user
      const hashedPassword = await hashPassword(req.body.password);
      // For demo purposes, set the user with username "admin" as admin
      const isAdmin = req.body.username.toLowerCase() === "admin";
      
      const [user] = await db
        .insert(users)
        .values({
          username: req.body.username,
          password: hashedPassword,
          isAdmin: isAdmin,
        })
        .returning();

      // Log in the new user
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user?: Express.User, info?: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send password to the client
    const { password, ...userWithoutPassword } = req.user as Express.User & { password: string };
    res.json(userWithoutPassword);
  });

  // Add deposit endpoint
  app.post("/api/deposit", async (req: Request, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { amount, paymentDetails } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid deposit amount" });
      }
      
      // Update user balance
      const userId = req.user.id;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newBalance = user.balance + amount;
      
      const [updatedUser] = await db
        .update(users)
        .set({ balance: newBalance })
        .where(eq(users.id, userId))
        .returning();
      
      // Return updated user info (without password)
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ 
        ...userWithoutPassword,
        depositStatus: "pending",
        message: "Deposit request received. An admin will review your payment details."
      });
    } catch (error) {
      next(error);
    }
  });
}
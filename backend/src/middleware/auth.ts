import { Request, Response, NextFunction } from "express";
import { getAuth } from "../config/auth.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (session) {
      req.user = session.user;
      req.session = session.session;
    }
    next();
  } catch (error) {
    // Ignore errors for optional auth, just proceed as guest
    next();
  }
};

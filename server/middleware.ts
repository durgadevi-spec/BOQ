import type { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyToken } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  console.log('[authMiddleware] authorization header:', authHeader);
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    console.log('[authMiddleware] no token provided');
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.log('[authMiddleware] token verification failed for token:', token.substring(0, 20) + '...');
    res.status(401).json({ message: "Unauthorized: Invalid token" });
    return;
  }
  console.log('[authMiddleware] token verified for user:', decoded.username, 'role:', decoded.role);

  req.user = {
    id: decoded.id,
    username: decoded.username,
    role: decoded.role,
  };

  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      return;
    }

    next();
  };
}

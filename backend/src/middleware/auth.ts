import { NextFunction, Request, Response } from 'express';
import { platformStore } from '../repositories/platformStore.js';
import { User } from '../types/platform.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = platformStore.findUserByToken(token);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }

  req.user = user;
  req.token = token;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = platformStore.findUserByToken(token);
    if (user) {
      req.user = user;
      req.token = token;
    }
  }
  next();
}

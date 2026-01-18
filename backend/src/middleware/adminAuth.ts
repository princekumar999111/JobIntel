import { Request, Response, NextFunction } from 'express';

/**
 * Admin role verification middleware
 * Assumes authenticateToken has already been called
 */
export function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (!user.roles || !user.roles.includes('admin')) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

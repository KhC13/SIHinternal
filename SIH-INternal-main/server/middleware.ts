import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'innovprocure_enterprise_jwt_super_secure_secret_key_2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId?: string | null;
  startupId?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      startupId: user.startupId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export async function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
}

export function requireRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. No session token provided.' });
    }
    if (req.user.role === 'SUPER_ADMIN' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      error: `Access Denied (RBAC): Your role '${req.user.role}' does not have sufficient permissions for this operation. Required: ${roles.join(', ')} or SUPER_ADMIN.`,
      userRole: req.user.role,
      requiredRoles: roles,
    });
  };
}

export async function logAudit(
  user: AuthenticatedUser | undefined,
  action: string,
  entity: string,
  entityId: string,
  metadata?: any,
  ipAddress?: string
) {
  try {
    const logId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await query(
      `INSERT INTO audit_logs (id, user_id, user_email, action, entity, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        logId,
        user?.id || null,
        user?.email || 'system',
        action,
        entity,
        entityId,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress || '127.0.0.1',
      ]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function createNotification(
  userId: string | null,
  role: string | null,
  title: string,
  message: string,
  link?: string
) {
  try {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await query(
      `INSERT INTO notifications (id, user_id, role, title, message, link, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [notifId, userId, role, title, message, link || null]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

import { Request, Response, NextFunction } from 'express';
import supabase from './supabase.js';
import Logger from './logger.js';

export interface AuthenticatedRequest extends Request {
    userId?: string;
    userEmail?: string | undefined;
}

/**
 * Middleware to verify JWT token from Supabase Auth
 * Extracts user ID from the token and attaches it to the request
 */
export async function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify the JWT token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            Logger.warn('[Auth] Invalid token:', error?.message);
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        // Attach user info to request
        req.userId = user.id;
        req.userEmail = user.email;

        next();
    } catch (error) {
        Logger.error('[Auth] Middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for endpoints that work with or without auth
 */
export async function optionalAuthMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user } } = await supabase.auth.getUser(token);

            if (user) {
                req.userId = user.id;
                req.userEmail = user.email;
            }
        }

        next();
    } catch (error) {
        // Log but don't fail
        Logger.warn('[Auth] Optional auth check failed:', error);
        next();
    }
}

export default authMiddleware;

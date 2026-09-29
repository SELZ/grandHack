import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { timingSafeEqual } from 'node:crypto'
import type { AuthedRequestUser } from '../types.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedRequestUser
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return secret
}

export function signSessionToken(user: AuthedRequestUser): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '12h', algorithm: 'HS256', issuer: 'grants-api', audience: 'grants-app' })
}

/**
 * Requires an `Authorization: Bearer <token>` header containing the JWT issued by
 * POST /api/auth/max. This token is a normal backend session token, separate from
 * the raw MAX WebAppData used only once, at login, to prove who the user is.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header' })
    return
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'], issuer: 'grants-api', audience: 'grants-app' }) as AuthedRequestUser
    if (!Number.isSafeInteger(payload.userId) || payload.userId <= 0 || !Number.isSafeInteger(payload.maxUserId)) throw new Error('Invalid session')
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session token' })
  }
}

/** For internal/admin endpoints called by trusted infra, not by the Mini App. */
export function requireInternalKey(req: Request, res: Response, next: NextFunction) {
  const provided = req.headers['x-internal-key']
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || typeof provided !== 'string' || Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    res.status(401).json({ error: 'Invalid internal key' })
    return
  }
  next()
}



import express, {
  type CookieOptions,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import {
  FieldValue,
  getFirestore as getAdminFirestore,
  type Firestore,
} from 'firebase-admin/firestore';

const COOKIE_NAME = 'syntax_admin_session';
const CREDENTIALS_FILE = path.resolve(process.cwd(), '.admin-credentials.json');

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? ''
    : crypto.createHash('sha256').update(`syntax-academy-${process.cwd()}`).digest('hex'));

interface StoredAdminCredential {
  salt: string;
  hash: string;
  rotatedAt: string;
}

function hashPassword(password: string, salt?: string) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash };
}

function getOrInitializeAdminCredential(): StoredAdminCredential | null {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const parsed = JSON.parse(
        fs.readFileSync(CREDENTIALS_FILE, 'utf-8')
      ) as StoredAdminCredential;

      if (parsed.salt && parsed.hash) return parsed;
    } catch {
      // Ignore an invalid local credentials file.
    }
  }

  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initialPassword) return null;

  const { salt, hash } = hashPassword(initialPassword);
  const record: StoredAdminCredential = {
    salt,
    hash,
    rotatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(record, null, 2), {
      mode: 0o600,
    });
  } catch {
    // Vercel filesystems may be read-only. Keep the credential in memory.
  }

  return record;
}

let activeAdminCredential = getOrInitializeAdminCredential();

function verifyAdminPassword(candidate: string): boolean {
  if (!activeAdminCredential) return false;

  const { hash } = hashPassword(candidate, activeAdminCredential.salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(activeAdminCredential.hash, 'hex');

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function signSessionToken(payload: {
  role: 'admin';
  issuedAt: number;
  expiresAt: number;
}): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');

  return `${data}.${sig}`;
}

function verifySessionToken(
  token: string | undefined
): { valid: boolean; expiresAt?: number } {
  if (!SESSION_SECRET || !token || !token.includes('.')) {
    return { valid: false };
  }

  const [data, sig] = token.split('.');
  if (!data || !sig) return { valid: false };

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);

  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return { valid: false };
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf-8')
    ) as { role: string; expiresAt: number };

    if (parsed.role !== 'admin' || Date.now() > parsed.expiresAt) {
      return { valid: false };
    }

    return { valid: true, expiresAt: parsed.expiresAt };
  } catch {
    return { valid: false };
  }
}

const rateBuckets = new Map<
  string,
  { count: number; resetAt: number }
>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const existing = rateBuckets.get(key);

    if (!existing || now > existing.resetAt) {
      rateBuckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (existing.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again shortly.',
      });
    }

    existing.count += 1;
    return next();
  };
}

let adminDb: Firestore | null = null;
let adminSdkReady = false;

async function initFirebaseAdmin() {
  try {
    const configPath = path.resolve(
      process.cwd(),
      'firebase-applet-config.json'
    );

    if (!fs.existsSync(configPath)) return;

    const fbConfig = JSON.parse(
      fs.readFileSync(configPath, 'utf-8')
    ) as {
      projectId: string;
      firestoreDatabaseId?: string;
    };

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );

      if (getApps().length === 0) {
        initializeApp({
          credential: cert(serviceAccount),
          projectId: fbConfig.projectId,
        });
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      if (getApps().length === 0) {
        initializeApp({
          credential: applicationDefault(),
          projectId: fbConfig.projectId,
        });
      }
    } else {
      return;
    }

    const db = fbConfig.firestoreDatabaseId
      ? getAdminFirestore(getApp(), fbConfig.firestoreDatabaseId)
      : getAdminFirestore(getApp());

    await db.collection('settings').limit(1).get();

    adminDb = db;
    adminSdkReady = true;
  } catch {
    adminDb = null;
    adminSdkReady = false;
  }
}

const firebaseInitPromise = initFirebaseAdmin();

function isHttpsRequest(req: Request): boolean {
  const protoHeader = String(req.headers['x-forwarded-proto'] || '');
  const firstProto = protoHeader.split(',')[0]?.trim().toLowerCase();

  return req.secure || req.protocol === 'https' || firstProto === 'https';
}

function getAdminCookieOptions(isHttps: boolean): CookieOptions {
  const options: CookieOptions & { partitioned?: boolean } = {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    partitioned: isHttps,
    path: '/',
  };

  return options as CookieOptions;
}

function requireAdminSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  const check = verifySessionToken(token);

  if (!check.valid) {
    return res.status(401).json({
      error: 'Unauthorized administrative session.',
    });
  }

  return next();
}

const app = express();

app.set('trust proxy', 1);
app.use((req, res, next) => {
  if (req.body !== undefined) {
    return next();
  }

  return express.json({ limit: '1mb' })(req, res, next);
});
app.use(cookieParser());

// Wait for Firebase initialization before handling API requests.
app.use(async (_req, _res, next) => {
  try {
    await firebaseInitPromise;
    next();
  } catch (error) {
    next(error);
  }
});

// Block direct HTTP access to sensitive files.
app.use((req, res, next) => {
  const blocked =
    /^\/(\.env.*|\.admin-credentials\.json|server\.ts|firestore\.rules|storage\.rules|firebase-blueprint\.json|security_spec\.md)$/i;

  if (blocked.test(req.path)) {
    return res.status(404).end();
  }

  return next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    adminSdkReady,
  });
});

app.get('/api/admin/session', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  const check = verifySessionToken(token);

  res.json({
    authenticated: check.valid,
    expiresAt: check.expiresAt || null,
    adminSdkReady,
    rotatedAt: activeAdminCredential?.rotatedAt || null,
  });
});

app.post('/api/admin/login', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  if (!activeAdminCredential || !SESSION_SECRET) {
    return res.status(503).json({
      error: 'Administrator authentication is not configured.',
    });
  }

  const { password } = req.body as { password?: unknown };

  if (
    typeof password !== 'string' ||
    password.length === 0 ||
    password.length > 200
  ) {
    return res.status(400).json({
      error: 'Valid password is required.',
    });
  }

  if (!verifyAdminPassword(password)) {
    return res.status(401).json({
      error: 'Invalid administrator credentials.',
    });
  }

  const now = Date.now();
  const expiresAt = now + 12 * 60 * 60 * 1000;
  const token = signSessionToken({
    role: 'admin',
    issuedAt: now,
    expiresAt,
  });

  const isHttps = isHttpsRequest(req);

  res.cookie(COOKIE_NAME, token, {
    ...getAdminCookieOptions(isHttps),
    maxAge: 12 * 60 * 60 * 1000,
  });

  return res.json({
    authenticated: true,
    expiresAt,
    adminSdkReady,
  });
});

app.post('/api/admin/logout', (req, res) => {
  const isHttps = isHttpsRequest(req);
  res.clearCookie(COOKIE_NAME, getAdminCookieOptions(isHttps));
  res.json({ authenticated: false });
});

app.post(
  '/api/admin/rotate-password',
  requireAdminSession,
  rateLimit(5, 15 * 60 * 1000),
  (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(501).json({
        error:
          'Password changes are temporarily disabled. Update the production environment variables instead.',
      });
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };

    if (
      typeof currentPassword !== 'string' ||
      !verifyAdminPassword(currentPassword)
    ) {
      return res.status(401).json({
        error: 'Current administrator password is incorrect.',
      });
    }

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 10 ||
      newPassword.length > 128
    ) {
      return res.status(400).json({
        error: 'New password must be between 10 and 128 characters.',
      });
    }

    const { salt, hash } = hashPassword(newPassword);

    const updated: StoredAdminCredential = {
      salt,
      hash,
      rotatedAt: new Date().toISOString(),
    };

    activeAdminCredential = updated;

    try {
      fs.writeFileSync(
        CREDENTIALS_FILE,
        JSON.stringify(updated, null, 2),
        { mode: 0o600 }
      );
    } catch {
      // Local-only persistence is best effort.
    }

    return res.json({
      success: true,
      rotatedAt: updated.rotatedAt,
    });
  }
);

app.post(
  '/api/comments/validate',
  rateLimit(15, 60 * 1000),
  (req, res) => {
    const { content } = req.body as { content?: unknown };

    if (typeof content !== 'string') {
      return res.status(400).json({
        valid: false,
        error: 'Invalid comment payload.',
      });
    }

    const trimmed = content.trim();

    if (trimmed.length < 2 || trimmed.length > 1000) {
      return res.status(400).json({
        valid: false,
        error: 'Comment must be between 2 and 1000 characters.',
      });
    }

    const spamPattern = /(https?:\/\/\S+){3,}|(<script|<iframe|javascript:)/i;

    if (spamPattern.test(trimmed)) {
      return res.status(400).json({
        valid: false,
        error: 'Comment flagged by spam protection.',
      });
    }

    return res.json({
      valid: true,
      sanitized: trimmed,
    });
  }
);

app.post('/api/admin/audit', requireAdminSession, async (req, res) => {
  if (!adminSdkReady || !adminDb) {
    return res.json({
      recorded: false,
      mode: 'client',
    });
  }

  try {
    const {
      actor,
      action,
      targetType,
      targetId,
      details,
    } = req.body as Record<string, string>;

    const id = `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    await adminDb.collection('auditLogs').doc(id).set({
      id,
      actor: String(actor || 'admin').slice(0, 160),
      action: String(action || 'action').slice(0, 120),
      targetType: String(targetType || 'system').slice(0, 80),
      targetId: String(targetId || 'none').slice(0, 128),
      details: String(details || '').slice(0, 1000),
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.json({
      recorded: true,
      mode: 'server',
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Audit error',
    });
  }
});

export default app;
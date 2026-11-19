import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import { ENV } from './server/config/env.ts';
import { initializeDatabase, closeDatabase } from './server/db/database.ts';
import { getFirebaseAdminDiagnostics, validateFirebaseAdminStartup } from './server/firebase/admin.ts';
import { attachSessionMiddleware, verifySameOriginForMutations } from './server/middleware/auth.ts';
import { authRouter } from './server/routes/authRoutes.ts';
import { publicRouter } from './server/routes/publicRoutes.ts';
import { workspaceRouter } from './server/routes/workspaceRoutes.ts';
import { attachWebSocketServer } from './server/ws/realtime.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initializeDatabase();
validateFirebaseAdminStartup();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Security response headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Capture rawBody for Razorpay webhook verification
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(verifySameOriginForMutations);
app.use(attachSessionMiddleware);

// Public health check — strictly minimal with no internal Firebase/project diagnostics
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Admin-only diagnostic health endpoint
app.get('/api/admin/system-health', (req, res) => {
  const authed = (req as { authUser?: { roles: string[] } }).authUser;
  if (!authed) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (!authed.roles.includes('admin')) {
    res.status(403).json({ error: 'Admin role required' });
    return;
  }
  const adminDiag = getFirebaseAdminDiagnostics();
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    firebaseAdmin: {
      initialized: adminDiag.initialized,
      hasServiceAccount: adminDiag.hasServiceAccount,
      mode: adminDiag.mode,
      projectId: adminDiag.projectId,
      error: adminDiag.error,
    },
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api', workspaceRouter);

// API 404 JSON handler (never fall through to SPA HTML)
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// API error handler
app.use('/api', (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status =
    typeof (err as { status?: number })?.status === 'number'
      ? (err as { status: number }).status
      : typeof (err as { statusCode?: number })?.statusCode === 'number'
        ? (err as { statusCode: number }).statusCode
        : 400;
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
});

// Real-time WebSocket server (/ws)
attachWebSocketServer(server);

async function setupFrontend(): Promise<void> {
  if (ENV.IS_DEV) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (req, res) => {
      if (req.path === '/api' || req.path.startsWith('/api/') || req.path.startsWith('/ws')) {
        res.status(404).json({ error: 'API endpoint not found.' });
        return;
      }
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application not built. Run "npm run build" first.');
      }
    });
  }

  const onListen = () => {
    const distBuilt = fs.existsSync(path.join(__dirname, 'dist', 'index.html'));
    const adminDiag = getFirebaseAdminDiagnostics();
    console.log(
      `Sanjay Vaishya Platform listening on ${ENV.PORT} (${ENV.IS_DEV ? 'development' : 'production'}) | dist=${
        distBuilt ? 'ready' : 'missing'
      } | firebaseAdmin=${adminDiag.mode}`
    );
  };

  server.on('error', (err: NodeJS.ErrnoException) => {
    console.error(`[FATAL] HTTP server failed to bind ${ENV.PORT}:`, err.code || err.message, err);
    process.exit(1);
  });

  if (typeof ENV.PORT === 'number') {
    server.listen(ENV.PORT, '0.0.0.0', onListen);
  } else {
    server.listen(ENV.PORT, onListen);
  }
}

let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down cleanly...`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }
  setTimeout(() => {
    closeDatabase();
    process.exit(0);
  }, 3000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

setupFrontend().catch((err) => {
  console.error('[FATAL] Failed to initialize application server:', err);
  process.exit(1);
});

import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import { ENV } from './server/config/env.ts';
import { initializeDatabase } from './server/db/database.ts';
import { attachSessionMiddleware, verifySameOriginForMutations } from './server/middleware/auth.ts';
import { authRouter } from './server/routes/authRoutes.ts';
import { publicRouter } from './server/routes/publicRoutes.ts';
import { workspaceRouter } from './server/routes/workspaceRoutes.ts';
import { attachWebSocketServer } from './server/ws/realtime.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initializeDatabase();

const app = express();
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

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api', workspaceRouter);

// API error handler
app.use('/api', (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(400).json({ error: message });
});

// Real-time WebSocket server on port 3000 (/ws)
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
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application not built. Run "npm run build" first.');
      }
    });
  }

  server.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(`Sanjay Vaishya Platform listening on port ${ENV.PORT} (${ENV.IS_DEV ? 'development' : 'production'})`);
  });
}

setupFrontend();

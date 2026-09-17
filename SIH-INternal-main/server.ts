// @ts-ignore — dependency typings may be unavailable in environments that install runtime packages only.
import express from 'express';
import path from 'path';
import cors from 'cors';
import net from 'net';
import { createServer as createViteServer } from 'vite';
import { initDatabaseSchema } from './server/db.js';
import { seedDatabaseIfEmpty } from './server/seedData.js';
import { router as apiRouter } from './server/routes.js';

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, HOST);
  });
}

async function getAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 25; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  return startPort;
}

async function startServer() {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize PostgreSQL Schema and Seed Data
  try {
    await initDatabaseSchema();
    await seedDatabaseIfEmpty();
  } catch (dbErr) {
    console.error('Database initialization warning:', dbErr);
  }

  // Static uploads directory
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'InnovProcure',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // Mount API router FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = await getAvailablePort(DEFAULT_PORT);
  if (port !== DEFAULT_PORT) {
    console.warn(`Port ${DEFAULT_PORT} is busy; using fallback port ${port} instead.`);
  }

  app.listen(port, HOST, () => {
    console.log(`InnovProcure Server running on http://${HOST}:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting InnovProcure server:', err);
  process.exit(1);
});

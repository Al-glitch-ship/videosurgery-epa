import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerAuthRoutes } from "./auth";
import { registerUploadRoutes } from "../upload";
import { registerVertexAiRoutes } from "../vertex-ai";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { backfillMilestones, syncSchema } from "../db";
import { securityMiddleware } from "./security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Apply security headers (Condição 1: Segurança total de dados)
  app.use(securityMiddleware);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Auto-login route (enquanto não há OAuth provider configurado)
  registerAuthRoutes(app);
  // Video upload routes
  registerUploadRoutes(app);
  // Vertex AI assistant routes (Grok 4.20 + Claude Opus)
  registerVertexAiRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Development mode uses Vite (dynamic import to avoid loading vite in production)
  // Production mode uses static files from a separate module (no vite dependency)
  if (process.env.NODE_ENV === "development") {
    // Use computed path so esbuild does NOT bundle vite.ts (it depends on devDependencies)
    const vitePath = "./vite" + "";
    const { setupVite } = await import(/* @vite-ignore */ vitePath);
    await setupVite(app, server);
  } else {
    const { serveStatic } = await import("./static");
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Sincroniza schema para suportar vídeos grandes (BIGINT)
    try {
      await syncSchema();
    } catch (err) {
      console.warn("[Startup] Schema sync failed (non-critical):", err);
    }

    // Auto-backfill milestones for criteria that have NULL milestone
    try {
      const result = await backfillMilestones();
      if (result.updated > 0) {
        console.log(`[Startup] Backfilled milestones: ${result.updated}/${result.total} criteria updated`);
      }
    } catch (err) {
      console.warn("[Startup] Milestone backfill failed (non-critical):", err);
    }
  });
}

startServer().catch(console.error);

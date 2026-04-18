import { Request, Response, NextFunction } from "express";

/**
 * Middleware de segurança para produção.
 * Aplica cabeçalhos de proteção sem bloquear o funcionamento do React/Vite.
 * Atende à Condição 1: Total sigilo e proteção contra vazamentos.
 */
export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Strict-Transport-Security: Força HTTPS em produção
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  
  // 2. X-Content-Type-Options: Previne ataques de MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // 3. X-Frame-Options: Bloqueia a aplicação de ser embutida em iframes (previne Clickjacking)
  res.setHeader("X-Frame-Options", "DENY");
  
  // 4. X-XSS-Protection: Habilita proteção contra Cross-Site Scripting no navegador
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // 5. Referrer-Policy: Controla a informação de referência passada para outros sites
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // 6. Cache-Control: Previne armazenamento indevido de requisições sensíveis da API
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
  }

  // 7. Permissions-Policy: Restringe acesso a câmera, microfone e geolocalização
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  next();
}

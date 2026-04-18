import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Diretório de uploads locais no servidor
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "videos");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Usa diskStorage para suportar arquivos grandes (>1GB) sem estourar a RAM
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop() || "mp4";
    cb(null, `${uuidv4()}.${ext}`);
  }
});

// Filtro: apenas vídeos permitidos
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado. Apenas vídeos são permitidos."));
  }
};

const upload = multer({ storage, fileFilter });

export function registerUploadRoutes(app: Express) {

  // POST /api/upload/:folderId — Upload de vídeo
  app.post(
    "/api/upload/:folderId",
    upload.single("video"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "Nenhum arquivo enviado" });
        }

        const filename = req.file.filename;
        const url = `/api/videos/stream/${filename}`;

        res.json({
          success: true,
          file: {
            filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            url,
            path: url,
            s3Key: filename,
          },
        });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Erro ao fazer upload do vídeo" });
      }
    }
  );

  // GET /api/videos/stream/:filename — Streaming seguro com HTTP 206 Range
  app.get("/api/videos/stream/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;

    // Segurança: impedir path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).send("Nome de arquivo inválido.");
    }

    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Vídeo não encontrado.");
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Cabeçalhos de segurança para vídeos médicos
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    if (range) {
      // Streaming em chunks (vital para arquivos grandes)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}

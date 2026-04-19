import { v4 as uuidv4 } from "uuid";
import type { Express, Request, Response } from "express";
import multer from "multer";
import { uploadToGCS } from "./gcs-storage";

// Usamos memoryStorage pois o arquivo será repassado imediatamente para o GCS
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado. Apenas vídeos são permitidos."));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // Limite inicial de 500MB via servidor (ideal usar Direct Upload para maiores)
  }
});

export function registerUploadRoutes(app: Express) {

  // POST /api/upload/:folderId — Upload de vídeo para o GCS
  app.post(
    "/api/upload/:folderId",
    upload.single("video"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "Nenhum arquivo enviado" });
        }

        const ext = req.file.originalname.split(".").pop() || "mp4";
        const filename = `videos/${uuidv4()}.${ext}`;
        
        console.log(`[Upload] Iniciando envio para GCS: ${filename}`);
        
        // Upload para o Google Cloud Storage
        const result = await uploadToGCS(
          req.file.buffer,
          filename,
          req.file.mimetype
        );

        // A URL retornada será usada para referência no banco de dados
        // O streaming real será feito via Signed URL no router de vídeos
        const videoUrl = `/api/videos/stream/${result.path}`;

        res.json({
          success: true,
          file: {
            filename: result.path,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            url: videoUrl,
            path: result.path,
            s3Key: result.path,
          },
        });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Erro ao fazer upload do vídeo para a nuvem" });
      }
    }
  );
}

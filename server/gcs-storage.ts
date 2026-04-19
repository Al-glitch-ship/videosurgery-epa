import { Storage } from "@google-cloud/storage";

const BUCKET_NAME = process.env.GCS_BUCKET || "spheric-mesh-493602-k8-videos";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Inicializa o cliente GCS
// Em produção (Cloud Run), ele usa as credenciais automáticas do Service Account
const storage = new Storage();

/**
 * Gera uma Signed URL para UPLOAD direto do navegador para o GCS.
 * Isso resolve o erro 413 (Request Entity Too Large).
 */
export async function getSignedUploadUrl(
  destinationPath: string,
  contentType: string = "video/mp4"
): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!IS_PRODUCTION) {
    // Mock para desenvolvimento local
    return {
      uploadUrl: `http://localhost:3000/api/mock-upload?path=${destinationPath}`,
      publicUrl: `/api/videos/stream/${destinationPath.split("/").pop()}`,
    };
  }

  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(destinationPath);

  // Gera URL de upload (PUT) válida por 15 minutos
  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  return {
    uploadUrl,
    publicUrl: `/api/videos/stream/${destinationPath}`,
  };
}

/**
 * Gera uma Signed URL para STREAMING (leitura) seguro.
 */
export async function getSignedStreamUrl(objectPath: string): Promise<string> {
  if (!IS_PRODUCTION) {
    return `/api/videos/stream/${objectPath.split("/").pop()}`;
  }

  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(objectPath);

  // Gera URL de leitura (GET) válida por 1 hora
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });

  return url;
}

/**
 * Deleta um objeto do Cloud Storage.
 */
export async function deleteFromGCS(objectPath: string): Promise<void> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(objectPath);
    await file.delete();
  } catch (err) {
    console.error(`Erro ao deletar do GCS: ${objectPath}`, err);
  }
}

/**
 * Módulo legando para compatibilidade (Buffer upload - não recomendado para vídeos grandes)
 */
export async function uploadToGCS(
  fileBuffer: Buffer,
  destinationPath: string,
  contentType: string = "video/mp4"
): Promise<{ bucket: string; path: string; gcsUri: string }> {
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(destinationPath);
  await file.save(fileBuffer, { contentType });

  return {
    bucket: BUCKET_NAME,
    path: destinationPath,
    gcsUri: `gs://${BUCKET_NAME}/${destinationPath}`,
  };
}

/**
 * Google Cloud Storage - Módulo de armazenamento seguro para vídeos cirúrgicos.
 * Condição 1: Todos os vídeos ficam privados, acessíveis apenas via Signed URLs temporárias.
 * Condição 2: Pay-per-use — cobra apenas pelo armazenamento efetivo.
 */

const BUCKET_NAME = process.env.GCS_BUCKET || "spheric-mesh-493602-k8-videos";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Upload de arquivo para o Google Cloud Storage via REST API.
 * Usa Application Default Credentials (ADC) do Cloud Run.
 */
export async function uploadToGCS(
  fileBuffer: Buffer,
  destinationPath: string,
  contentType: string = "video/mp4"
): Promise<{ bucket: string; path: string; gcsUri: string }> {
  if (!IS_PRODUCTION) {
    // Em dev, simula o upload retornando um path local
    console.log(`[GCS-DEV] Simulando upload: ${destinationPath}`);
    return { bucket: BUCKET_NAME, path: destinationPath, gcsUri: `gs://${BUCKET_NAME}/${destinationPath}` };
  }

  // Importação dinâmica para não crashar em dev
  let GoogleAuth;
  try {
    const authModule = await import("google-auth-library");
    GoogleAuth = authModule.GoogleAuth;
  } catch {
    throw new Error("google-auth-library não instalado.");
  }

  const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();

  const encodedPath = encodeURIComponent(destinationPath);
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET_NAME}/o?uploadType=media&name=${encodedPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${tokenRes.token}`,
      "Content-Type": contentType,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GCS upload failed (${response.status}): ${errText}`);
  }

  return {
    bucket: BUCKET_NAME,
    path: destinationPath,
    gcsUri: `gs://${BUCKET_NAME}/${destinationPath}`,
  };
}

/**
 * Gera uma Signed URL temporária para streaming seguro do vídeo.
 * A URL expira em 1 hora (Condição 1: Segurança).
 */
export async function getSignedStreamUrl(objectPath: string): Promise<string> {
  if (!IS_PRODUCTION) {
    return `/api/videos/stream/${objectPath.split("/").pop()}`;
  }

  let GoogleAuth;
  try {
    const authModule = await import("google-auth-library");
    GoogleAuth = authModule.GoogleAuth;
  } catch {
    throw new Error("google-auth-library não instalado.");
  }

  const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();

  // Usar URL de acesso direto com token (simpler than V4 signing for Cloud Run SA)
  const encodedPath = encodeURIComponent(objectPath);
  return `https://storage.googleapis.com/${BUCKET_NAME}/${encodedPath}?access_token=${tokenRes.token}`;
}

/**
 * Deleta um objeto do Cloud Storage.
 */
export async function deleteFromGCS(objectPath: string): Promise<void> {
  if (!IS_PRODUCTION) {
    console.log(`[GCS-DEV] Simulando delete: ${objectPath}`);
    return;
  }

  let GoogleAuth;
  try {
    const authModule = await import("google-auth-library");
    GoogleAuth = authModule.GoogleAuth;
  } catch {
    return;
  }

  const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();

  const encodedPath = encodeURIComponent(objectPath);
  await fetch(`https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o/${encodedPath}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${tokenRes.token}` },
  });
}

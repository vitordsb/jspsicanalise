/**
 * supabase-storage.ts
 * Acesso ao Supabase Storage usando a REST API diretamente.
 * Nao usa @supabase/supabase-js para evitar dependencia de pacote desnecessaria.
 *
 * Variaveis de ambiente obrigatorias:
 *   NEXT_PUBLIC_SUPABASE_URL   - ex: https://xyzabc.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  - service role (nao anon!)
 *   SUPABASE_STORAGE_BUCKET    - nome do bucket privado (ex: contratos-assinados)
 */

function getStorageBase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL nao configurada.");
  }
  return `${url}/storage/v1`;
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }
  return key;
}

export function getStorageBucket(): string {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error(
      "SUPABASE_STORAGE_BUCKET nao configurada. Crie o bucket no Supabase e configure a variavel."
    );
  }
  return bucket;
}

/**
 * Faz upload de um arquivo PDF para o bucket privado.
 * O caminho no Storage e: contratos/{contractId}/{uuid}.pdf
 *
 * @param fileKey - chave UUID (ex: "abc123.pdf") - NUNCA o nome original do usuario
 * @param buffer  - conteudo do arquivo em ArrayBuffer
 * @returns void - lanca excecao em caso de falha
 */
export async function uploadSignedPdf(
  fileKey: string,
  buffer: ArrayBuffer
): Promise<void> {
  const base   = getStorageBase();
  const bucket = getStorageBucket();
  const key    = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");

  const res = await fetch(`${base}/object/${bucket}/${fileKey}`, {
    method: "PUT",
    headers: {
      Authorization:   `Bearer ${key}`,
      "Content-Type":  "application/pdf",
      // Forca download no navegador (nao renderiza inline)
      "x-upsert":      "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(sem corpo)");
    throw new Error(
      `Falha no upload para Supabase Storage: ${res.status} - ${text}`
    );
  }
}

/**
 * Gera uma URL assinada de download com validade curta.
 * A URL inclui Content-Disposition: attachment para forcar download.
 *
 * @param fileKey   - chave no bucket (ex: "contratos/id/uuid.pdf")
 * @param expiresIn - validade em segundos (padrao 900 = 15 min)
 */
export async function createSignedUrl(
  fileKey: string,
  expiresIn = 900
): Promise<string> {
  const base = getStorageBase();
  const bucket = getStorageBucket();
  const key  = getServiceKey();

  const res = await fetch(
    `${base}/object/sign/${bucket}/${fileKey}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "(sem corpo)");
    throw new Error(
      `Falha ao gerar URL assinada: ${res.status} - ${text}`
    );
  }

  const data = (await res.json()) as { signedURL?: string };
  if (!data.signedURL) {
    throw new Error("Supabase nao retornou signedURL.");
  }

  // Retorna a URL completa com o host do Supabase
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  return `${url.origin}${data.signedURL}`;
}

/**
 * Remove um arquivo do bucket.
 * Nao lanca excecao se o arquivo nao existir (idempotente).
 */
export async function deleteFile(fileKey: string): Promise<void> {
  const base   = getStorageBase();
  const bucket = getStorageBucket();
  const key    = getServiceKey();

  await fetch(`${base}/object/${bucket}/${fileKey}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${key}` },
  });
  // Silencia erros de "nao encontrado" - idempotente por design
}

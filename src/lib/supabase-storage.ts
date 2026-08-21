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
/**
 * Cabecalhos de autenticacao do Storage.
 *
 * As chaves novas do Supabase (formato sb_secret_...) nao sao JWT. Mandar
 * apenas Authorization: Bearer faz a API tentar decodificar como JWT e
 * responder "Invalid Compact JWS". O header apikey e o que ela aceita.
 * Os dois vao juntos para funcionar tambem com as chaves legadas (eyJ...).
 */
function cabecalhosAuth(): Record<string, string> {
  const key = getServiceKey();
  return { apikey: key, Authorization: `Bearer ${key}` };
}

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
      ...cabecalhosAuth(),
      "Content-Type": "application/pdf",
      "x-upsert":     "true",
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
        ...cabecalhosAuth(),
        "Content-Type": "application/json",
      },
      // download: true forca Content-Disposition: attachment na URL assinada,
      // impedindo que um PDF com JavaScript embutido execute no navegador.
      body: JSON.stringify({ expiresIn, download: true }),
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

  // O Supabase devolve signedURL relativo a /storage/v1 (ex:
  // "/object/sign/files/..."). Concatenar so com a origem gera 404, porque o
  // prefixo /storage/v1 fica de fora. Montamos a partir de getStorageBase(),
  // que ja inclui o prefixo, removendo barra duplicada.
  const relativo = data.signedURL.startsWith("/") ? data.signedURL.slice(1) : data.signedURL;

  // download na query e o que de fato faz o Supabase responder com
  // Content-Disposition: attachment. Passar no corpo do POST nao surte efeito.
  // Importa porque PDF pode conter JavaScript: baixar em vez de renderizar
  // no navegador fecha essa porta.
  const url = new URL(`${base}/${relativo}`);
  url.searchParams.set("download", "");
  return url.toString();
}

/**
 * Remove um arquivo do bucket.
 * Nao lanca excecao se o arquivo nao existir (idempotente).
 */
export async function deleteFile(fileKey: string): Promise<void> {
  const base   = getStorageBase();
  const bucket = getStorageBucket();

  await fetch(`${base}/object/${bucket}/${fileKey}`, {
    method: "DELETE",
    headers: cabecalhosAuth(),
  });
  // Silencia erros de "nao encontrado" - idempotente por design
}

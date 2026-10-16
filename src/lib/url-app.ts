/** URL publica da aplicacao, para os links de e-mail apontarem para o lugar certo. */
export function urlDoApp(): string {
  const explicita = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicita) return explicita.replace(/\/$/, "");
  // Na Vercel, VERCEL_URL vem sem protocolo.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

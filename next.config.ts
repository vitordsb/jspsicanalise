import type { NextConfig } from "next";

const securityHeaders = [
  // Impede que a pagina seja carregada em iframe (protege contra clickjacking)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Impede que o browser infira o tipo de conteudo (MIME sniffing)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Politica de referrer: nao vaza URL em requests para outros dominios
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // HSTS: forca HTTPS por 1 ano (ativo apenas em producao via next.config, nao em dev)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Permissions Policy: desabilita APIs desnecessarias
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // CSP: politica conservadora para uma SPA Next.js com Tailwind e fontes externas
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts inline sao necessarios para o Next.js (_next chunks)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Estilos inline sao usados pelo Tailwind e pelos emails
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      // Supabase para chamadas de API direta (se houver)
      "connect-src 'self' https://*.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplica em todas as rotas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

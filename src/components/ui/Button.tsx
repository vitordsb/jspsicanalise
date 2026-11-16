/**
 * Botao do design system (Material Design 3).
 *
 * Quatro variantes de enfase, da mais forte para a mais leve:
 *   filled   - acao principal da tela (uma por vez)
 *   tonal    - acao secundaria importante
 *   outlined - acao secundaria
 *   text     - acao terciaria, links de apoio
 * "onDark" e "onDarkOutlined" existem para fundo vinho.
 *
 * Com `href` vira link (Link do Next para rota interna, <a> para externo);
 * sem, vira <button>. Altura minima de 44px: alvo de toque confortavel.
 */

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { clsx } from "clsx";

type Variante = "filled" | "tonal" | "outlined" | "text" | "onDark" | "onDarkOutlined";
type Tamanho = "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  filled: "bg-primary text-on-primary shadow-sm hover:bg-primary-hover hover:shadow-md",
  tonal: "bg-primary-container text-primary hover:bg-primary-container-high",
  outlined: "border border-outline text-primary hover:bg-primary/[0.06]",
  text: "text-primary hover:bg-primary/[0.08]",
  onDark: "bg-white text-primary shadow-sm hover:bg-primary-container-low",
  onDarkOutlined: "border border-white/50 text-white hover:bg-white/10",
};

const TAMANHOS: Record<Tamanho, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-14 px-8 text-base",
};

interface Props {
  variante?: Variante;
  tamanho?: Tamanho;
  icone?: ReactNode;
  className?: string;
  children: ReactNode;
}

type BotaoProps = Props & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, keyof Props>;
type LinkProps = Props & { href: string } & Omit<ComponentPropsWithoutRef<"a">, keyof Props | "href">;

export function Button(props: BotaoProps | LinkProps) {
  const { variante = "filled", tamanho = "md", icone, className, children, ...resto } = props;
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold",
    "transition-[background-color,box-shadow] duration-200 select-none",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTES[variante],
    TAMANHOS[tamanho],
    className
  );
  const conteudo = (
    <>
      {icone}
      <span>{children}</span>
    </>
  );

  if ("href" in resto && resto.href) {
    const { href, ...a } = resto as ComponentPropsWithoutRef<"a"> & { href: string };
    const externo = /^https?:\/\//.test(href);
    if (externo) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...a}>
          {conteudo}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...a}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(resto as ComponentPropsWithoutRef<"button">)}>
      {conteudo}
    </button>
  );
}

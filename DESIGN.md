# Design system

Material Design 3, com a paleta vinho e creme da marca. Tailwind 4: os tokens
vivem em `src/app/globals.css`, dentro de `@theme`.

## Regra principal

Use o **papel** da cor, nunca o hex. `bg-primary`, `text-on-surface-variant`,
`border-outline-variant`. Hex solto em classe (`bg-[#5d0c1d]`) nao entra mais.

## Papeis de cor

| Papel | Uso |
|---|---|
| `primary`, `on-primary`, `primary-hover` | Acao principal, titulos, links de marca |
| `primary-container`, `-high`, `-low` | Fundos tonais, selecao, destaque suave |
| `secondary`, `secondary-container` | Acento (itálicos, alertas de marca) |
| `tertiary`, `tertiary-dark` | Detalhes dourados |
| `surface` | Fundo da pagina |
| `surface-low`, `surface-container`, `surface-container-high` | Camadas de fundo, da mais clara para a mais escura |
| `on-surface` | Texto principal |
| `on-surface-variant` | Texto secundario |
| `on-surface-subtle` | Texto de apoio (passa AA em texto pequeno) |
| `outline` | Borda de campo de formulario (contraste 3:1) |
| `outline-variant` | Divisor e borda de cartao |
| `error`, `success`, `warning`, `info`, `violet` | Estados, cada um com `-container` e `-outline` |

## Componentes (`src/components/ui`)

- `Button`: `filled` (acao principal, uma por tela), `tonal`, `outlined`, `text`,
  `onDark`, `onDarkOutlined`. Com `href` vira link. Altura minima de 44px.
- `Chip`: rotulo informativo curto.
- `Toast`, `Carregando`: ja existentes.

## Formas

- Botao: pilula (`rounded-full`).
- Campo de formulario: `rounded-lg` com `border-outline`. Campo de busca pode ser pilula.
- Cartao: `rounded-2xl` ou `rounded-3xl` (os raios foram reduzidos em `@theme`).

## Texto

- Titulos em Lora (`font-serif`), corpo em Source Sans 3.
- `text-xs` = 13px e `text-sm` = 15px (um degrau acima do padrao do Tailwind).
- Nao usar texto abaixo de 11px.

## Acessibilidade

- Foco visivel global: anel de 2px em `primary`.
- Alvo de toque de pelo menos 44px.
- Contraste AA em todo texto. Nao use `on-surface-subtle` para informacao critica.

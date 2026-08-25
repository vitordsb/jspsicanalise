# Lembrete de consulta

> Status: rascunho · Atualizado: 2026-08-24

## Problema

Paciente esquece a consulta. Falta sem avisar custa duas coisas de uma vez: a
sessão não é reposta e o horário não pôde ser oferecido a mais ninguém.

Hoje não existe lembrete nenhum. Quem lembra é a Joane, de cabeça, uma pessoa
por vez, no WhatsApp. Isso não escala e depende dela ter tempo naquele dia.

O contrato já cobra falta sem aviso de 24 horas, mas cobrar não recupera o
horário. O objetivo aqui não é cobrar melhor, é a consulta acontecer.

## O que é

Um aviso automático por e-mail, 48 horas antes da consulta, com dois botões:
confirmar presença ou pedir remarcação. Quem não responde aparece marcado na
agenda da Joane, para ela decidir se cobra ou deixa quieto.

As 48 horas não são arredondamento. O contrato exige aviso de cancelamento com
24 horas de antecedência: um lembrete que chega 24 horas antes cai exatamente
em cima do limite, e quem perceber ali que não pode ir já avisa em cima da
hora e paga pela falta. Chegando com 48 horas, ainda dá tempo de desmarcar
dentro da regra. O paciente não é cobrado e a Joane recupera o horário com
folga para oferecer a outra pessoa. O lembrete deixa de ser aviso e vira
prevenção.

## Usuário / público

- **Paciente**: recebe o e-mail no meio da rotina, decide em um toque. Muitos
  vão ler no celular, então o e-mail precisa funcionar em tela pequena e o
  botão precisa resolver sem exigir login.
- **Joane**: olha a agenda antes do dia e vê quem confirmou, quem pediu
  remarcação e quem não respondeu.

## Escopo

### v1 (mínimo que entrega valor)

- Cron diário varre as consultas que acontecem daqui a 48 horas e dispara o
  e-mail. Um envio por consulta, com marcador no banco para nunca repetir.
- E-mail com data, horário, duração e dois botões: "Confirmo minha presença" e
  "Preciso remarcar".
- Cada botão é um link assinado (HMAC), de uso único e com validade, que
  autoriza só aquelas duas ações. Sem login, sem dado clínico, sem poder
  cancelar.
- "Preciso remarcar" abre o pedido de remarcação que já existe na plataforma,
  e o horário original segue reservado até a Joane responder.
- Página de retorno simples confirmando o que aconteceu.
- Na agenda da Joane: marcador de confirmado, remarcação pedida ou sem
  resposta.

### Fora da v1 (futuro)

- **WhatsApp automático.** É onde brasileiro lê de verdade, mas exige API
  oficial da Meta, aprovação de template e custo por conversa. Semanas de
  burocracia antes da primeira mensagem. Vale reavaliar depois de medir a taxa
  de resposta do e-mail.
- **Botão de WhatsApp pronto no painel**, com a mensagem já escrita, para ela
  cobrar em um clique quem não respondeu. Meio termo barato, mas só faz
  sentido depois de saber quantos ficam sem responder.
- Segundo lembrete no dia da consulta.
- Lembrete de horas antes, em vez de dias. Ver Restrições.
- **Bloqueio de datas na agenda** (férias, feriado, congresso). Ideia separada,
  registrada aqui para não se perder. Esbarra em consulta já marcada dentro do
  período bloqueado, que é o caso que decide o desenho.

## Decisões tomadas

- **48 horas antes, não 24.** Para caber dentro da janela de cancelamento do
  contrato. Um só envio: duas mensagens pela mesma consulta viram barulho e a
  pessoa para de ler as duas.
- **Só e-mail na v1.** Já está montado, custo zero, entrega em minutos. Gente
  não abre e-mail, é verdade, mas dá para medir e decidir o próximo canal com
  dado em vez de palpite.
- **Pede confirmação, não só avisa.** O momento em que a pessoa lê o lembrete é
  exatamente quando ela decidiria avisar que não pode ir. Só avisar
  desperdiçaria isso.
- **Link assinado em vez de login.** Pedir CPF e código para clicar em
  "confirmo" faria quase ninguém confirmar, e a feature viraria e-mail
  decorativo. Como nenhuma das duas ações cancela nada nem expõe dado clínico,
  o risco de quem tem acesso ao e-mail agir no lugar da pessoa é aceitável.
- **Sem resposta não dispara nada automático.** A agenda mostra e a Joane
  decide. Desmarcar sozinho alguém que ia aparecer é pior que o problema que
  resolveria.

## Restrições

- **O cron da Vercel Hobby roda uma vez por dia.** É o que define a v1: dá para
  fazer "daqui a 48 horas", não "daqui a 2 horas". Lembrete de horas antes
  exigiria trocar de plano ou usar agendador externo.
- O módulo de e-mail (`src/lib/mail.ts`) e o disparo em segundo plano
  (`src/lib/avisos.ts`) já existem e funcionam em produção via Resend.
- O pedido de remarcação já existe: `POST /api/paciente/agenda/[id]/remarcar`.
  O lembrete se pendura nele, não constrói um fluxo paralelo.
- Nenhum e-mail da plataforma carrega conteúdo clínico. Vale aqui também.

## Como saber se deu certo

Comparar a taxa de falta antes e depois. A plataforma já registra o status
`falta` em cada agendamento, então não é preciso construir medição nova.

**Não há linha de base ainda.** Hoje o banco tem 6 agendamentos, 0 realizados e
0 faltas: a plataforma é nova demais para ter histórico. Na prática só dá para
avaliar depois de alguns meses de uso real. Métrica secundária, essa sim
disponível de imediato: quantos confirmam, quantos pedem remarcação e quantos
ignoram.

## Perguntas em aberto

- Que horas do dia o cron dispara? Fim de tarde tende a ser lido; de
  madrugada some na caixa de entrada da manhã.
- Quanto tempo o link assinado vale? 72 horas cobre o intervalo até a consulta
  com folga, mas é escolha a fazer.
- Consulta marcada com menos de 48 horas de antecedência nunca receberia
  lembrete. Manda na hora, manda 24 horas antes, ou não manda?
- Primeira consulta e retorno merecem o mesmo texto? Quem nunca foi tem mais
  chance de faltar e talvez precise de mais informação, como endereço ou link
  da chamada.

## Riscos / incertezas

- **E-mail pode simplesmente não ser lido.** É o risco central da v1 inteira, e
  a razão de medir a taxa de resposta antes de investir em WhatsApp.
- **Link assinado é um endereço que age sem login.** Vazou o e-mail, alguém
  confirma ou pede remarcação no lugar da pessoa. Contido por escopo (só duas
  ações), uso único e validade curta, mas é superfície nova.
- **Lembrete pode virar chateação.** Uma mensagem por consulta é aceitável;
  qualquer coisa além disso precisa de motivo forte.
- Cron diário que falha em silêncio deixa de avisar sem ninguém perceber. Vale
  registrar em log quantos e-mails saíram a cada execução.

## Próximos passos

- [ ] Construir → `/dev-build`
- [ ] Ou seguir lapidando

## Log de refinamento

- **P:** Por onde o lembrete chega no paciente? · **R:** Só e-mail na v1.
  WhatsApp automático fica para depois de medir.
- **P:** O lembrete só avisa ou pede resposta? · **R:** Pede confirmação, com
  botão de confirmar e de pedir remarcação.
- **P:** Quando dispara? · **R:** 48 horas antes, para caber na janela de
  cancelamento de 24 horas do contrato.
- **P:** Como o botão do e-mail funciona sem login? · **R:** Link assinado de
  uso único, limitado a confirmar presença e abrir pedido de remarcação.
- **P:** Ninguém confirmou até a véspera, o que acontece? · **R:** A agenda
  mostra quem não respondeu. Nada automático.
- **Tensão levantada:** o cron da Vercel Hobby é diário, então "lembrar 2 horas
  antes" não existe sem trocar de plano. A v1 trabalha em dias, não em horas.
- **Tensão levantada:** lembrete 24 horas antes cai em cima do limite de
  cancelamento do contrato e empurra o paciente para a cobrança. Foi o que
  levou às 48 horas.

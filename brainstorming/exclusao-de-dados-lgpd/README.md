# Exclusão de dados a pedido do paciente

> Status: rascunho · Atualizado: 2026-08-24

## Problema

A plataforma guarda anamnese psicanalítica completa, CPF, RG, endereço,
contrato assinado e triagem de risco. Dado de saúde, o mais sensível que a
LGPD reconhece.

O paciente tem direito de pedir exclusão (Art. 18, VI) e **hoje não existe
caminho nenhum**. Nem botão, nem formulário, nem procedimento. Se alguém
pedir, a Joane não tem o que fazer além de mexer no banco por fora, o que não
deixa registro de que ela cumpriu.

Foi apontado na auditoria de segurança desta plataforma como pendência legal.

## O que é

Um pedido de exclusão que o paciente abre na área dele e a Joane executa pelo
painel. O que pode ser apagado some na hora. O que a lei obriga a guardar fica
bloqueado, invisível no uso diário, e expira sozinho no prazo. O paciente
recebe um comprovante dizendo exatamente o que foi apagado, o que ficou, por
quê e até quando.

## A tensão que define tudo

**"Apagar tudo" não é legalmente disponível, e prometer isso seria mentira.**

A Resolução CFP 001/2009 obriga o psicólogo a guardar o prontuário por 5 anos.
A própria LGPD (Art. 16) autoriza reter dado quando há obrigação legal ou
regulatória. Ou seja: o direito de exclusão existe, mas não alcança o
prontuário dentro do prazo de guarda.

Uma tela que promete apagar tudo colocaria a Joane em falta com o conselho
dela e a deixaria sem registro se houvesse questionamento sobre o atendimento.
O desenho abaixo existe para ser honesto com as duas normas ao mesmo tempo.

## Usuário / público

- **Paciente**: quer sair. Às vezes por privacidade, às vezes por ruptura com o
  processo. Precisa entender o que vai acontecer sem ler jurisprudência.
- **Joane**: precisa cumprir a lei, manter o que o conselho exige e ter
  registro de que cumpriu.

## Escopo

### v1 (mínimo que entrega valor)

**Camada 1, apaga na hora (sem base legal para reter):**

- Anamnese de quem nunca virou paciente: sem consulta e sem contrato, não houve
  relação clínica. É formulário de contato com conteúdo sensível, e guardar 5
  anos seria reter dado de saúde sem finalidade, o oposto do que a LGPD pede.
- Dados de contato sem vínculo a atendimento: e-mail, telefone.
- Token de acesso à área do paciente e agendamentos futuros.

**Camada 2, bloqueia e expira (obrigação legal de guarda):**

- Prontuário de quem foi atendido: anamnese, notas clínicas, histórico.
- Contrato assinado, que além do prontuário é prova de um acordo com efeitos
  financeiros.
- Bloqueado significa: sai da listagem, sai da busca, não abre no uso diário,
  fica marcado como "retido por obrigação legal até DD/MM/AAAA". Some sozinho
  no vencimento.

**Fluxo:**

- Paciente abre o pedido na área dele. A tela explica, antes de confirmar, o
  que vai ser apagado e o que fica retido, com o prazo.
- Se houver contrato ativo ou consulta marcada, o pedido é aceito mesmo assim,
  com aviso de que isso encerra o acompanhamento na plataforma.
- A Joane vê o pedido no painel, com o que será apagado e o que será retido já
  discriminado, e executa.
- O paciente recebe comprovante por e-mail.
- Registro do pedido e da execução fica guardado, porque é ele que prova que a
  Joane cumpriu.

### Fora da v1 (futuro)

- Expiração automática dos 5 anos por cron. Na v1 o prazo fica marcado e
  visível; apagar automaticamente pode esperar, já que o primeiro vencimento
  está a anos de distância.
- Portabilidade (Art. 18, V): exportar os dados em formato legível.
- Exclusão iniciada pela Joane, para faxina de base sem pedido do paciente.

## Decisões tomadas

- **Exclusão por camadas, conforme a base legal.** Anonimizar tudo foi
  descartado porque prontuário anônimo não serve de prontuário e deixaria a
  Joane sem o registro que o conselho exige. Apagar tudo foi descartado por
  colocá-la em falta com a Resolução CFP 001/2009.
- **Pedido, e a Joane executa.** Dado clínico apagado não volta, e a
  autenticação da área do paciente é CPF mais código numérico, o que não é
  forte o bastante para uma ação irreversível. O passo dela também abre espaço
  para uma conversa antes.
- **Anamnese sem vínculo apaga na hora.** Quem preencheu e nunca marcou nada
  não estabeleceu relação clínica.
- **Pedido em tratamento ativo é aceito, com aviso.** Bloquear enquanto houver
  contrato seria negar o direito enquanto ele corre, o que é frágil perante a
  LGPD. Mas a tela precisa dizer com todas as letras que isso encerra o
  acompanhamento, porque o pedido costuma vir em momento de crise ou de
  ruptura com a terapeuta, e é aí que a pessoa menos consegue prever a
  consequência.
- **Comprovante detalhado, não confirmação simples.** A LGPD exige informar, e
  isso também protege a Joane: fica registrado que ela cumpriu e explicou. Um
  "seus dados foram removidos" que omite a retenção legal soa como quebra de
  promessa quando a pessoa descobre depois.

## Restrições

- Resolução CFP 001/2009: guarda mínima de 5 anos do prontuário.
- LGPD Art. 16 (retenção por obrigação legal), Art. 18 (direitos do titular),
  Art. 11 (dado sensível de saúde).
- A exclusão precisa alcançar também o **Supabase Storage**, onde ficam os PDFs
  de contrato assinado. Apagar a linha do banco e deixar o arquivo é vazamento
  esperando acontecer.
- Contrato assinado eletronicamente guarda `signedText`, o documento inteiro
  congelado, com nome, CPF e endereço. Entra na camada 2.
- O contrato já tem regra de não poder ser excluído depois de assinado. As duas
  regras precisam conversar em vez de se contradizer.

## Perguntas em aberto

- **Quando começa a contagem dos 5 anos?** A resolução fala do último registro
  ou último atendimento, não da data de cadastro. Precisa ficar explícito no
  código, senão cada um interpreta de um jeito.
- O que acontece se a mesma pessoa voltar a ser paciente depois de ter pedido
  exclusão? Cadastro novo do zero ou reativa o antigo?
- A Joane pode recusar um pedido? Se sim, com que fundamento e o que o paciente
  vê?
- Prazo para executar. A LGPD não crava um número para exclusão, mas deixar em
  aberto vira "depois eu faço". 15 dias parece razoável.
- Dado bloqueado ainda aparece em relatório, exportação ou backup? Bloqueio que
  vaza por uma porta lateral não é bloqueio.

## Riscos / incertezas

- **Interpretação jurídica.** Todo o desenho se apoia na leitura de que
  obrigação do conselho prevalece sobre o pedido de exclusão dentro do prazo.
  É a leitura corrente, mas **vale confirmar com quem entende de direito
  médico antes de ir para produção**, porque quem responde perante o conselho
  é a Joane.
- **Irreversibilidade.** Apagar por engano não tem desfazer. A confirmação
  precisa ser difícil de acionar sem querer.
- **Pedido em momento de crise.** Alguém em sofrimento apaga o acesso, perde a
  agenda e o contrato, e no dia seguinte quer voltar. O aviso ajuda, mas não
  resolve inteiro.
- **Bloqueio mal feito é pior que não bloquear**, porque dá sensação de
  cumprimento sem cumprir. Precisa valer em toda consulta ao banco, não só na
  listagem principal.
- A anamnese carrega triagem de risco (ideação suicida, autolesão). Apagar
  ficha com sinalização de risco tem peso clínico próprio, e hoje a limpeza
  automática de 24 horas já preserva esses casos de propósito. Vale decidir se
  a exclusão a pedido respeita a mesma exceção ou se a vontade do titular
  prevalece.

## Próximos passos

- [ ] Confirmar a leitura jurídica com alguém de direito médico
- [ ] Construir → `/dev-build`
- [ ] Ou seguir lapidando

## Log de refinamento

- **Tensão levantada:** "apagar tudo" não é legalmente disponível. CFP
  001/2009 obriga guardar prontuário por 5 anos e a LGPD Art. 16 permite
  reter por obrigação legal. Foi o que definiu o desenho por camadas.
- **P:** O que acontece de fato com os dados? · **R:** Por camadas, conforme a
  base legal. Apaga o que não tem obrigação de guarda, bloqueia o resto até
  vencer.
- **P:** Quem dispara a exclusão? · **R:** O paciente pede, a Joane executa.
- **P:** Anamnese de quem nunca virou paciente conta como prontuário? · **R:**
  Não. Apaga na hora.
- **P:** Paciente em tratamento ativo pede exclusão, o que o sistema faz? ·
  **R:** Aceita, avisando que isso encerra o acompanhamento e que o prontuário
  fica retido pelo prazo legal.
- **P:** O que o paciente recebe depois de executada? · **R:** Comprovante
  detalhado, dizendo o que foi apagado, o que ficou, sob qual base legal e até
  quando.

# Plataforma de Anamnese Clínica - Joane Souza Oliveira de Andrade

Plataforma monolítica moderna e acolhedora em Next.js para acolhimento, preenchimento virtual de anamneses psicológicas/psicanalíticas, gestão de pacientes com interface inspirada no **WhatsApp Web**, controle de versões de anamnese e geração automática de contratos de prestação de serviços para a **Dra. Joane Souza Oliveira de Andrade**.

---

## 🌟 Funcionalidades Implementadas

### 1. Preenchimento de Anamnese Virtual (`/preencher-anamnese`)
- **Etapa 1 (Dados Pessoais):** Nome completo, CPF, E-mail, Telefone/WhatsApp, Data de Nascimento, Gênero, Profissão e Estado Civil.
- **Etapa 2 (Questionário Dinâmico):** Perguntas organizadas por seções (Queixa Principal, Histórico Emocional, Relações Familiares, Hábitos & Sono, Expectativas), consumindo dinamicamente o modelo ativo configurado pela Joane.
- **Prevenção de Duplicidade Proativa:** Se um paciente já enviou uma anamnese anteriormente (pelo CPF), o sistema informa imediatamente que a ficha **"está em análise pela Dra. Joane"**, prevenindo envios duplicados.
- **Notificação por E-mail:** Ao enviar a análise, um e-mail formatado é enviado para a Joane com os dados do paciente e resumo da queixa principal.
- **Experiência Acolhedora:** Arquétipo visual feminino e profissional (tons suaves de terracota, rosa chá, areia e sálvia) com celebração visual ao concluir.

---

### 2. Painel de Pacientes no Estilo WhatsApp Web (`/admin/clientes`)
- **Barra Lateral Esquerda (Lista de Conversas/Pacientes):**
  - Barra de busca por nome, CPF ou sintomas.
  - Filtros rápidos: `Todos`, `Pendentes (Novo)`, `Em Análise`, `Aprovados`, `Arquivados`.
  - Cards com avatar em tons pastéis, data/hora da submissão, snippet da queixa principal e badges de status.
- **Painel Principal Direito:**
  - Cabeçalho com dados rápidos (Nome, Idade calculada, CPF, Telefone).
  - Botão direto para **abrir conversa no WhatsApp** (`wa.me`) com mensagem inicial personalizada.
  - Botão para **Gerar Contrato de Prestação de Serviços**.
  - Botão para **Imprimir Ficha Completa** (com layout médico formatado).
  - Seletor rápido de status do paciente (Pendente ➔ Em Análise ➔ Aprovado ➔ Arquivado).
  - **Aba de Ficha de Anamnese:** Visualização fiel de todas as respostas do paciente na versão de documento que ele preencheu.
  - **Aba de Anotações Clínicas:** Bloco de notas privado para a Joane registrar impressões diagnósticas e hipóteses com salvamento instantâneo.
  - **Aba de Contratos:** Lista dos contratos emitidos para o paciente.

---

### 3. Modelos de Anamnese & Form Builder (`/admin/anamneses`)
- Visualização de todas as anamneses criadas e histórico de versões.
- **Form Builder Visual:** Permite adicionar/remover seções e perguntas (Texto curto, Texto longo, Escolha única / Radio, Múltipla escolha / Checkbox, Seleção / Dropdown, Escala de 1 a 10, Data, Número).
- Botão **"Tornar Ativa"** para definir qual versão será preenchida no link público `/preencher-anamnese`.
- Botão **"Duplicar"** para criar novas versões (v2, v3) com facilidade.

---

### 4. Gerador de Contrato de Prestação de Serviços (`/admin/contratos`)
- Integração dos **dados estáticos da Dra. Joane** (Nome, Registro Profissional, Endereço) com os **dados dinâmicos do paciente** (resgatados da anamnese).
- Cláusulas editáveis: Valor da sessão (R$), periodicidade, duração, política de cancelamento (24h de antecedência), forma de pagamento (PIX) e sigilo ético.
- **Visualização e Impressão A4:** Layout pronto para impressão e salvamento em PDF com linhas de assinatura.

---

### 5. Configurações da Clínica (`/admin/configuracoes`)
- Edição do perfil da Dra. Joane (Nome, Especialidade, CRP/CBO, WhatsApp, E-mail para receber notificações, Nome da Clínica e Endereço).

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** Next.js 16 (App Router, TypeScript, Server & Client Components)
- **Estilização:** Tailwind CSS v4 com paleta personalizada e tema WhatsApp Web
- **Banco de Dados:** SQLite com Prisma ORM (Portável, autônomo, sem necessidade de banco externo local)
- **Ícones:** Lucide React
- **Envio de E-mails:** Nodemailer (com simulação em console para desenvolvimento local e suporte a SMTP real)
- **Efeitos:** Canvas Confetti

---

## 🚀 Como Executar Localmente

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Inicializar o Banco de Dados e Seeds:**
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

3. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   # ou na porta 3005 se a 3000 estiver ocupada:
   npm run dev -- -p 3005
   ```

4. **Acessar as Rotas:**
   - **Página Inicial:** [http://localhost:3005](http://localhost:3005)
   - **Link de Anamnese do Paciente:** [http://localhost:3005/preencher-anamnese](http://localhost:3005/preencher-anamnese)
   - **Painel WhatsApp Web da Joane:** [http://localhost:3005/admin/clientes](http://localhost:3005/admin/clientes)
   - **Modelos de Anamnese:** [http://localhost:3005/admin/anamneses](http://localhost:3005/admin/anamneses)
   - **Contratos:** [http://localhost:3005/admin/contratos](http://localhost:3005/admin/contratos)
   - **Configurações:** [http://localhost:3005/admin/configuracoes](http://localhost:3005/admin/configuracoes)

# 🎮 Checkpoint — Rede Social de Jogos

> **Projeto Integrador — UNIEURO 2025**
> Disciplina: Projeto Integrador | Professor: Jorge Osvaldo Alves de Lima Torres
> Equipe: Samuel · Vinícius · Ana Júlia

Checkpoint é uma rede social de jogos inspirada no Letterboxd. Permite registrar, avaliar e descobrir jogos com a comunidade — com meia estrela, likes em avaliações, perfis públicos, listas colaborativas, biblioteca pessoal e vitrine customizável.

---

## 🚀 Início rápido

### Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 18.x ou superior |
| npm | 9.x ou superior |

### Instalação

```bash
# 1. Extraia o ZIP e abra no VS Code
code checkpoint_v1_5

# 2. Backend
cd backend
npm install
npm run db:setup
npm run dev

# 3. Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

Abra **http://localhost:5173** no navegador.

---

## ⚠️ Erro mais comum e como resolver

```
PrismaClientKnownRequestError: The table `main.TAB_AVALIACAO` does not exist
```

**Causa:** As migrações do banco de dados nunca foram aplicadas.

**Solução em 1 comando:**
```bash
cd backend
npm run db:setup
```

Este comando executa `prisma db push` (cria/atualiza as tabelas) seguido do seed (popula dados de teste).

Se ainda falhar, tente:
```bash
cd backend
npm run db:reset
npm run db:seed
```

---

## 👥 Contas de teste

| Usuário | Senha | Permissão |
|---|---|---|
| `admin` | `admin123` | ADMIN — acesso total ao painel |
| `gamer_br` | `senha123` | USER — perfil com biblioteca completa |
| `player_one` | `senha123` | USER — jogador competitivo |
| `casual_gamer` | `senha123` | USER — jogador casual |

---

## 📁 Estrutura do projeto

```
checkpoint_v1_5/
├── backend/                 # API Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma    # Modelo de dados
│   │   ├── importData.ts    # Seed de dados de teste
│   │   └── migrations/      # Histórico de migrações
│   ├── src/
│   │   ├── middlewares/     # authMiddleware, errorMiddleware
│   │   ├── routes/          # Uma rota por domínio
│   │   ├── utils/           # auth, helpers, prisma, validate
│   │   └── server.ts        # Entry point
│   └── .env                 # Variáveis de ambiente
│
└── frontend/                # React + Vite + Tailwind
    └── src/
        ├── components/      # ui.tsx, Layout, Footer, SearchCommand
        ├── context/         # AuthContext, ToastContext
        ├── hooks/           # useDebounce, useReveal, useLibraryMap
        ├── pages/           # Landing, Feed, Games, Profile, Library…
        ├── services/        # api.ts (Axios configurado)
        └── types.ts         # Tipos TypeScript compartilhados
```

---

## 🔧 Scripts disponíveis

### Backend (`cd backend`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia servidor em modo watch (hot reload) |
| `npm run db:setup` | **Cria tabelas + popula dados de teste** (use no primeiro setup) |
| `npm run db:migrate` | Aplica migrações pendentes |
| `npm run db:seed` | Popula dados de teste (sem recriar tabelas) |
| `npm run db:studio` | Abre o Prisma Studio (interface visual do banco) |
| `npm run build` | Compila TypeScript para produção |

### Frontend (`cd frontend`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia Vite em modo desenvolvimento |
| `npm run build` | Compila para produção |
| `npm run preview` | Visualiza o build de produção |

---

## 🌐 Variáveis de ambiente

O arquivo `backend/.env` já vem configurado para desenvolvimento local.
Para mudar configurações, edite:

```env
DATABASE_URL="file:./dev.db"        # Banco SQLite local
JWT_SECRET="sua_chave_secreta"       # Mín. 20 caracteres — OBRIGATÓRIO
JWT_EXPIRES_IN="7d"                  # Expiração do token
PORT=3333                            # Porta da API
FRONTEND_URL="http://localhost:5173" # URL do frontend (CORS)
```

> **Atenção:** O servidor não sobe sem JWT_SECRET configurado. Isso é intencional por segurança.

---

## 🔌 Endpoints da API

Base URL: `http://localhost:3333/api`

| Rota | Método | Auth | Descrição |
|---|---|---|---|
| `/health` | GET | — | Status da API |
| `/feed/stats` | GET | — | Contadores públicos |
| `/feed/discover` | GET | — | Atividades da comunidade |
| `/feed/following` | GET | ✅ | Feed de quem você segue |
| `/auth/register` | POST | — | Criar conta |
| `/auth/login` | POST | — | Login |
| `/auth/me` | GET | ✅ | Dados do usuário logado |
| `/games` | GET | — | Listar jogos (filtros, sort) |
| `/games/:id` | GET | — | Detalhes + distribuição de notas |
| `/reviews` | POST | ✅ | Criar/editar avaliação |
| `/reviews/:id/like` | POST | ✅ | Curtir avaliação |
| `/users/:id` | GET | — | Perfil público |
| `/users/:id/followers` | GET | — | Seguidores |
| `/users/:id/following` | GET | — | Seguindo |
| `/library` | GET | ✅ | Biblioteca pessoal |
| `/library/vitrine` | PUT | ✅ | Atualizar vitrine |
| `/lists` | GET | — | Listas públicas |
| `/admin/dashboard` | GET | 🔐 | Métricas (admin) |

---

## ⭐ Sistema de avaliação (meia estrela)

As notas são armazenadas internamente em escala **1-10** e exibidas em **0.5 a 5 estrelas**:

| Nota interna | Estrelas exibidas |
|---|---|
| 1 | ★☆☆☆☆ (0.5) |
| 2 | ★☆☆☆☆ (1.0) |
| 5 | ★★☆☆☆ (2.5) |
| 8 | ★★★★☆ (4.0) |
| 10 | ★★★★★ (5.0) |

Fórmula: `estrelas = nota / 2`

---

## 🏗️ Arquitetura

```
┌──────────────────┐       HTTP/JSON       ┌──────────────────┐
│  React (Vite)    │ ◄─── /api proxy ────► │  Express API     │
│  port 5173       │                        │  port 3333       │
└──────────────────┘                        └────────┬─────────┘
                                                     │ Prisma ORM
                                                     ▼
                                            ┌──────────────────┐
                                            │  SQLite (dev.db) │
                                            │  7 tabelas       │
                                            └──────────────────┘
```

**Por que SQLite?** Simplicidade para desenvolvimento e apresentação acadêmica. Para produção, altere `provider = "sqlite"` para `"postgresql"` em `schema.prisma` e atualize `DATABASE_URL`.

---

## 🔐 Segurança implementada

- JWT_SECRET obrigatório no startup (sem fallback)
- Rate limit: 200 req/min geral, **10 req/min para `/auth/login`**
- Senhas com bcrypt (salt 10)
- Helmet.js para headers HTTP seguros
- Auth opcional nos perfis públicos (sem exposição de dados)
- Validação de IDs em todas as rotas (helper `parseId`)
- Verificação de existência antes de operações destrutivas
- Listas privadas protegidas por autorização

---

## 🚫 Funcionalidades planejadas para v1.6

Itens que ficaram fora do escopo desta versão:

- Likes em listas
- Comentários em avaliações
- Diário de jogadas (múltiplas sessões por jogo)
- Feed de atividades (TAB_ATIVIDADE)
- Drag-and-drop na Vitrine
- Paginação/infinite scroll
- Menu mobile responsivo
- Internacionalização (i18n)

---

## 📝 Changelog v1.5

### Novidades
- ⭐ Meia estrela (escala 1-10 interna)
- 👍 Likes em avaliações (com contador)
- 📊 Distribuição de notas na página do jogo
- 🌐 Perfil público (sem necessidade de login)
- 📈 Estatísticas de biblioteca no perfil
- 👥 Modal de seguidores/seguindo clicáveis
- 🦶 Footer em todas as páginas
- 🔍 Busca global (jogos + usuários na navbar)
- 📊 Seção de estatísticas na landing (estilo Letterboxd)
- 🔃 Ordenação no catálogo (A-Z, melhor avaliado, mais avaliado, mais recente)
- 📝 Comentário opcional nas avaliações

### Correções
- 🐛 **Bug crítico:** `db:setup` resolve "table does not exist"
- 🔒 JWT_SECRET obrigatório (sem fallback "secret")
- 🔒 Rate limit específico para login (10/min)
- 🔒 Permissões de listas: valida dono/admin antes de alterar
- 🔒 Listas privadas protegidas corretamente
- 🏗️ Busca de listas movida para o banco (não mais em JS)
- 🎯 `parseId` helper em todas as rotas
- 🎨 `styles.css` formatado (não minificado)
- 🗝️ React keys corretas nos mapas de status (usa `id_status`)
- 🔄 `useReveal` com singleton guard (evita observers duplicados)
- ✉️ Formulário de criar lista escondido para não-logados
- 🔀 404 page para rotas inexistentes
- 📋 Admin com 3 abas: Dashboard, Jogos, Usuários

---

*Checkpoint v1.5 — Desenvolvido como Projeto Integrador UNIEURO 2025*

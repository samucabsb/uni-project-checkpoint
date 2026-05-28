# Checkpoint v1.6 — Rede Social de Jogos

> Projeto Integrador — UNIEURO  
> Disciplina: Projeto Integrador  
> Professor: Jorge Osvaldo Alves de Lima Torres  
> Integrantes: Samuel, Vinícius, Ana Júlia

---

## Sobre o projeto

O **Checkpoint** é uma rede social para gamers inspirada no Letterboxd. Os usuários podem registrar jogos na biblioteca, escrever avaliações com nota e comentário, criar listas temáticas, seguir outros jogadores e acompanhar um feed de atividades sociais em tempo real.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Node.js · Express · TypeScript |
| ORM / Banco | Prisma ORM · SQLite |
| Autenticação | JWT · Bcrypt |
| Validação | Zod |
| Frontend | React · TypeScript · Vite |
| Estilização | Tailwind CSS |
| Estado servidor | TanStack Query (React Query) |
| HTTP client | Axios |
| Roteamento | React Router v6 |
| Ícones | Lucide React |

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **npm** 9 ou superior

---

## Instalação e execução

### 1. Backend

```bash
cd backend
npm install
npm run db:setup 
npm run dev        
```

### 2. Frontend (novo terminal)

```bash
cd frontend
npm install
npm run dev       
```

Acesse: **http://localhost:5173**

---

## Scripts disponíveis

### Backend (`/backend`)

| Script | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor com hot-reload (tsx watch) |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm start` | Inicia o build compilado (produção) |
| `npm run db:setup` | Aplica o schema + popula dados iniciais |
| `npm run db:reset` | Reseta o banco e repopula (⚠ apaga tudo) |
| `npm run db:studio` | Abre o Prisma Studio (interface visual do banco) |

### Frontend (`/frontend`)

| Script | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `npm run build` | Gera build de produção em `/dist` |
| `npm run preview` | Pré-visualiza o build de produção |

---

## Variáveis de ambiente

### `/backend/.env`

```env
DATABASE_URL="file:./dev.db"   # Caminho do banco SQLite
JWT_SECRET="checkpoint_secret_key_dev"  # Troque em produção!
PORT=3001
NODE_ENV=development
```

> O arquivo `.env` já vem configurado e pronto para rodar localmente.  
> **Em produção:** use um `JWT_SECRET` forte e considere migrar para PostgreSQL.

---

## Usuários de teste

| Usuário | Senha | Perfil |
|---|---|---|
| `admin` | `admin123` | Administrador (acesso ao painel) |
| `gamer_br` | `senha123` | Usuário comum |
| `player_one` | `senha123` | Usuário comum |
| `casual_gamer` | `senha123` | Usuário comum |

---

## Arquitetura do sistema

```
checkpoint_v1_6/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Definição do banco com enums e relações
│   │   └── importData.ts        # Seed de dados iniciais (12 jogos, 4 usuários)
│   └── src/
│       ├── middlewares/
│       │   ├── authMiddleware.ts # JWT + optionalAuth
│       │   └── errorMiddleware.ts # Tratamento global de erros
│       ├── routes/
│       │   ├── auth.routes.ts    # Registro e login
│       │   ├── games.routes.ts   # CRUD jogos (admin) + hub social
│       │   ├── reviews.routes.ts # Avaliações + likes + comentários
│       │   ├── lists.routes.ts   # Listas + likes + ordenação
│       │   ├── library.routes.ts # Biblioteca do usuário + vitrine
│       │   ├── users.routes.ts   # Perfil + follow/unfollow
│       │   ├── feed.routes.ts    # Feed de atividades + trending
│       │   ├── search.routes.ts  # Busca global unificada
│       │   ├── diary.routes.ts   # Diário de sessões
│       │   └── index.ts          # Registro de todas as rotas
│       └── utils/
│           ├── activities.ts     # Log de atividades sociais (falha silenciosa)
│           ├── auth.ts           # Geração e verificação de JWT
│           ├── helpers.ts        # sanitizeUser, calcMedia
│           ├── prisma.ts         # Cliente Prisma singleton
│           └── validate.ts       # parseId, clamp, notaParaEstrelas
│
└── frontend/
    └── src/
        ├── components/
        │   ├── ui.tsx            # Button, Input, Stars, Modal, GameCard, ReviewCard...
        │   ├── Layout.tsx        # Navbar responsiva (mobile hamburger)
        │   ├── SearchCommand.tsx # Busca global (jogos + usuários + listas)
        │   └── Footer.tsx
        ├── context/
        │   ├── AuthContext.tsx   # Estado de autenticação global
        │   └── ToastContext.tsx  # Notificações com auto-dismiss e fechar
        ├── hooks/
        │   └── index.ts          # useReveal (MutationObserver), useDebounce, useLibraryMap
        ├── pages/
        │   ├── Landing.tsx       # Home: trending, stats, catálogo
        │   ├── auth/             # Login e cadastro
        │   ├── feed/Feed.tsx     # Timeline + trending + discover
        │   ├── games/            # Catálogo e detalhe do jogo
        │   ├── lists/            # Listas com likes e ordenação
        │   ├── profile/          # Perfil com vitrine, stats e diário
        │   ├── reviews/          # Página individual com comentários
        │   ├── diary/            # Diário de sessões
        │   ├── library/          # Biblioteca do usuário
        │   └── admin/            # Painel administrativo
        ├── services/api.ts       # Instância Axios configurada
        └── types.ts              # Todos os tipos TypeScript compartilhados
```

---

## Funcionalidades v1.6

### Novas features
- **Feed de atividades** — timeline social de quem você segue (avaliou, favoritou, criou lista, seguiu, etc.)
- **Trending** — jogos mais avaliados e reviews mais curtidas da semana/mês/todos os tempos
- **Likes em listas** — botão curtir em todas as listas da comunidade
- **Busca global unificada** — um único request busca jogos + usuários + listas
- **Página de review individual** (`/reviews/:id`) — review completa com comentários
- **Comentários em reviews** — discussão diretamente na avaliação
- **Diário de jogos** (`/diario`) — histórico de múltiplas sessões por jogo
- **GameDetails como hub social** — listas que contêm o jogo, reviews populares/recentes
- **Perfil aprimorado** — vitrine em destaque, estatísticas visuais, abas (visão geral, avaliações, listas, diário)
- **Ordenação manual de listas** — botões ↑↓ para reordenar jogos
- **Navbar mobile** com menu hamburger, Esc fecha

### Correções de bugs
- **Seções da landing somiam** ao recarregar → `useReveal` reescrito com `MutationObserver`
- **Imagens quebradas** nos cards → `onError` com fallback em todas as imagens
- **N+1 queries** em reviews → `getLikedSet()` resolve em 2 queries ao invés de N+1
- **Vitrine com posição duplicada** → `@@unique([id_usuario, top_position])` no schema

### Melhorias técnicas
- Enums no Prisma (`TipoUsuario`, `StatusJogo`, `TipoAtividade`) — type-safe no TypeScript
- Normalização de `nm_usuario` e `email_usuario` (lowercase + trim no cadastro)
- Índices no banco em campos de consulta frequente
- Toast com duração customizável por tipo e botão de fechar manual
- `aria-label` em todos os botões de ação (acessibilidade)
- Fechar modais com tecla `Esc`
- `GameCard` mobile-friendly: link "Ver jogo" sempre visível (não depende de hover)

---

## Banco de dados (SQLite + Prisma)

O banco é criado automaticamente com `npm run db:setup`. Não precisa instalar nada separado.

**Para visualizar o banco graficamente:**
```bash
cd backend
npx prisma studio   # Abre em http://localhost:5555
```

**Para resetar e repopular:**
```bash
cd backend
npm run db:reset
```

---

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Dados do usuário logado |
| GET | `/games` | Listar jogos (com filtros) |
| GET | `/games/:id` | Detalhes do jogo + reviews + listas |
| GET | `/games/popular` | Jogos populares por período |
| GET | `/reviews` | Reviews recentes |
| GET | `/reviews/popular` | Reviews mais curtidas |
| GET | `/reviews/:id` | Review individual |
| POST | `/reviews/:id/comments` | Comentar em uma review |
| GET | `/reviews/:id/comments` | Listar comentários |
| POST | `/lists` | Criar lista |
| POST | `/lists/:id/like` | Curtir lista |
| PUT | `/lists/:id/games/order` | Reordenar jogos da lista |
| GET | `/feed/following` | Timeline de atividades de quem você segue |
| GET | `/feed/trending` | Trending por período |
| GET | `/search?q=` | Busca global (jogos + usuários + listas) |
| GET | `/diary` | Diário do usuário logado |
| POST | `/diary` | Adicionar entrada no diário |
| GET | `/users/:id` | Perfil público completo |
| POST | `/users/:id/follow` | Seguir usuário |
| GET | `/admin/dashboard` | Dashboard (admin only) |

---

## Solução de problemas

### ❌ Erro: "@prisma/client did not initialize yet"

Ocorre quando `npm run db:setup` falha antes de gerar o cliente Prisma. Execute manualmente:

```bash
cd backend
npx prisma generate   # Gera o cliente Prisma
npm run db:setup      # Cria o banco e popula com dados
npm run dev
```

### ❌ Erro de download do Prisma em rede com proxy/firewall

O Prisma precisa baixar um binário nativo (~30 MB) durante o `prisma generate`. Em redes com proxy (ex: laboratório de faculdade), isso pode falhar.

**Solução A — Via variável de ambiente (mais simples):**
```bash
# Windows PowerShell
$env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
npx prisma generate
npm run db:setup
```

**Solução B — Configurar proxy do npm:**
```bash
npm config set proxy http://ENDEREÇO_DO_PROXY:PORTA
npm config set https-proxy http://ENDEREÇO_DO_PROXY:PORTA
npm install
```

**Solução C — Gerar na sua máquina e copiar (mais confiável):**
1. Gere o projeto normalmente em uma rede sem restrições
2. Comprima a pasta `node_modules/.prisma` em ZIP
3. Leve o ZIP para a máquina restrita e extraia em `backend/node_modules/.prisma`
4. Execute apenas `npm run db:setup`

### ❌ Telas em branco ou sem dados

- Verifique se o backend está rodando: acesse `http://localhost:3333/api/health`
- Certifique-se de ter rodado `npm run db:setup` no backend
- Abra o DevTools (F12) → Console para ver erros específicos

### ❌ Erro de CORS

- Certifique-se que `FRONTEND_URL=http://localhost:5173` no `.env` do backend
- Frontend deve estar rodando na porta 5173 (`npm run dev`)

## Observações

1. **SQLite** é ideal para desenvolvimento e apresentações acadêmicas. Para produção real, migre para PostgreSQL alterando `provider = "postgresql"` no schema e ajustando `DATABASE_URL`.

2. O **JWT_SECRET** no `.env` é para desenvolvimento. Nunca use em produção sem trocar por uma string forte e aleatória.

3. As **imagens dos jogos** são URLs externas. Se alguma URL expirar, o fallback exibe um placeholder colorido com o nome do jogo.

4. O sistema usa **`db:push`** em vez de migrations. Para um ambiente de produção com dados reais, prefira `prisma migrate`.

5. A pasta `node_modules` e o arquivo `dev.db` são excluídos do ZIP automaticamente.

---

## Versões

| Versão | Destaques |
|---|---|
| v1.0 | MVP: jogos, biblioteca, autenticação |
| v1.2 | Avaliações com estrelas, perfil público |
| v1.4 | Listas, follows, vitrine, painel admin |
| v1.5 | Likes em reviews, UI polida, seeds ricos |
| v1.6 | Feed de atividades, trending, comentários, likes em listas, busca unificada, diário, perfil aprimorado, mobile, acessibilidade |

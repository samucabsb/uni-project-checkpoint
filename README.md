<div align="center">

# 🎮 Checkpoint

**Uma rede social para gamers avaliarem, organizarem e descobrirem jogos.**

Inspirado no modelo social do Letterboxd, o Checkpoint permite registrar sua jornada gamer,
avaliar jogos com meia estrela, criar listas temáticas, montar uma vitrine de favoritos,
seguir outros jogadores e acompanhar atividades da comunidade em tempo real.

---

![Version](https://img.shields.io/badge/versão-1.7.0-22c55e?style=for-the-badge)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb?style=for-the-badge)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933?style=for-the-badge)
![Database](https://img.shields.io/badge/banco-Prisma%20%2B%20SQLite-2d3748?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/linguagem-TypeScript-3178c6?style=for-the-badge)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-facc15?style=for-the-badge)

**UNIEURO — Projeto Integrador**  
Samuel · Vinícius · Ana Júlia  
Prof. Jorge Osvaldo A. L. Torres

</div>

---

## 📋 Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack tecnológica](#-stack-tecnológica)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e execução](#-instalação-e-execução)
- [Scripts disponíveis](#-scripts-disponíveis)
- [Usuários de teste](#-usuários-de-teste)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Rotas da API](#-rotas-da-api)
- [Banco de dados](#-banco-de-dados)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Solução de problemas](#-solução-de-problemas)
- [Changelog](#-changelog)

---

## 🎯 Sobre o projeto

O **Checkpoint** nasceu como projeto integrador da UNIEURO com o objetivo de unir desenvolvimento full stack com um produto que simule o mercado real. A inspiração principal é o [Letterboxd](https://letterboxd.com/) — uma rede social para cinema — adaptada para o universo dos videogames.

O sistema foi construído do zero com TypeScript em todas as camadas, arquitetura REST, autenticação JWT, validação com Zod e um frontend em React que comunica com o backend via Axios + React Query.

---

## ✨ Funcionalidades

### 👤 Usuários e autenticação
- Cadastro com nome, e-mail e senha (normalização automática em lowercase)
- Login com JWT (token válido por 7 dias)
- Editar bio e foto de perfil
- Perfil público (acessível sem login)
- Seguir e deixar de seguir outros jogadores
- Vitrine: até 4 jogos favoritos em destaque no perfil

### 🎮 Jogos
- Catálogo com filtros por gênero, plataforma, ano e classificação
- Ordenação por nome, data, nota e mais avaliados
- Página individual com média, distribuição de notas e avaliações
- Listas que contêm o jogo
- Botões de status rápido (Zerado, Jogando, Quero jogar, Abandonado) e Favoritar

### ⭐ Avaliações
- Nota de 0.5 a 5.0 estrelas (escala interna 1–10 com meia estrela)
- Comentário opcional
- Data de quando jogou (bloqueio de datas futuras)
- Likes nas avaliações
- Página individual com comentários
- Excluir avaliação (dono ou admin)

### 📋 Listas
- Criar listas públicas ou privadas
- Adicionar e remover jogos
- Ordenação manual com botões ↑↓
- Curtir listas de outros jogadores

### 📚 Biblioteca pessoal
- Status de cada jogo: `QUERO_JOGAR`, `JOGANDO`, `ZERADO`, `ABANDONADO`
- Marcar favoritos
- Vitrine do perfil com Top 4

### 📓 Diário de jogos
- Registrar múltiplas sessões por jogo
- Nota e comentário por sessão (opcionais)
- Histórico agrupado por mês
- Aba "Diário" no perfil de cada usuário

### 📰 Feed social
- **Minhas atividades** — suas próprias ações registradas
- **Seguindo** — timeline de atividades de quem você segue
- **Descobrir** — atividades da comunidade + jogadores ativos
- **Em alta** — trending por semana, mês ou todos os tempos

### 🔍 Busca
- Busca global unificada: jogos, jogadores e listas em um único campo
- Resultados com seções separadas no dropdown

### 🛡️ Painel Admin
- Dashboard com totais (usuários, jogos, avaliações, listas, atividades)
- Criar, editar e excluir jogos do catálogo

---

## 🛠️ Stack tecnológica

| Camada | Tecnologia | Motivo |
|---|---|---|
| **Runtime** | Node.js 18+ | Suporte LTS estável |
| **Framework** | Express 4 | Simples, maduro, bem documentado |
| **Linguagem** | TypeScript | Type safety em todo o projeto |
| **ORM** | Prisma 5 | Schema declarativo, queries type-safe |
| **Banco** | SQLite (dev) | Zero configuração, ideal para acadêmico |
| **Auth** | JWT + Bcrypt | Padrão de mercado para APIs REST |
| **Validação** | Zod | Schema validation com inferência TypeScript |
| **Frontend** | React 18 + Vite | SPA performático com HMR |
| **Estado** | TanStack Query | Cache inteligente + sincronização server state |
| **HTTP** | Axios | Interceptors para token automático |
| **Roteamento** | React Router v6 | Rotas declarativas com loaders |
| **Estilização** | Tailwind CSS | Utility-first, produtivo |
| **Ícones** | Lucide React | Consistentes e acessíveis |

---

## 📦 Pré-requisitos

- **Node.js** 18 ou superior — [nodejs.org](https://nodejs.org)
- **npm** 9 ou superior (incluído com o Node)

Verifique com:
```bash
node --version   # deve mostrar v18.x.x ou superior
npm --version    # deve mostrar 9.x.x ou superior
```

---

## 🚀 Instalação e execução

### 1. Extraia o projeto

```bash
unzip checkpoint_v1_6_1.zip
cd checkpoint_v1_6_1
```

### 2. Configure e inicie o backend

```bash
cd backend

# Instala dependências
npm install

# OBRIGATÓRIO antes do db:setup — gera o cliente Prisma
npx prisma generate

# Cria o banco SQLite e popula com dados de teste
npm run db:setup

# Inicia o servidor em modo desenvolvimento (hot-reload)
npm run dev
# → API rodando em http://localhost:3333
```

### 3. Configure e inicie o frontend (novo terminal)

```bash
cd frontend
npm install
npm run dev
# → App rodando em http://localhost:5173
```

Acesse: **[http://localhost:5173](http://localhost:5173)**

---

## 📜 Scripts disponíveis

### Backend (`/backend`)

| Script | Comando interno | Descrição |
|---|---|---|
| `npm run dev` | `tsx watch src/server.ts` | Servidor com hot-reload |
| `npm run build` | `tsc` | Compila TypeScript |
| `npm start` | `node dist/server.js` | Inicia build de produção |
| `npm run db:setup` | `prisma db push && tsx prisma/importData.ts` | Cria banco + popula seed |
| `npm run db:reset` | `prisma db push --force-reset && tsx prisma/importData.ts` | Reseta e repopula (**apaga tudo**) |
| `npm run db:studio` | `prisma studio` | Interface visual do banco em localhost:5555 |

### Frontend (`/frontend`)

| Script | Comando interno | Descrição |
|---|---|---|
| `npm run dev` | `vite` | Dev server com HMR |
| `npm run build` | `tsc && vite build` | Build de produção em `/dist` |
| `npm run preview` | `vite preview` | Preview do build local |

---

## 👤 Usuários de teste

Criados automaticamente pelo seed (`npm run db:setup`):

| Usuário | Senha | Tipo | Observações |
|---|---|---|---|
| `admin` | `admin123` | 🛡️ Admin | Acesso ao painel admin, pode criar/editar/excluir jogos |
| `gamer_br` | `senha123` | Usuário | 6 avaliações, vitrine completa (Top 4), listas |
| `player_one` | `senha123` | Usuário | Especialista em FPS e indies, segue gamer_br |
| `casual_gamer` | `senha123` | Usuário | Gosta de histórias, segue gamer_br |

> **Dica de apresentação:** Faça login como `gamer_br`, explore o perfil, a vitrine, o diário e o feed. Depois entre como `player_one` para ver o feed "Seguindo" com as atividades de quem você segue.

---

## 📁 Estrutura de pastas

```
checkpoint_v1_6_1/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Definição do banco (tabelas, relações, índices)
│   │   └── importData.ts          # Seed de dados iniciais (12 jogos, 4 usuários)
│   │
│   └── src/
│       ├── middlewares/
│       │   ├── authMiddleware.ts  # JWT decode + optionalAuth
│       │   └── errorMiddleware.ts # Tratamento global (Zod + Prisma + genérico)
│       │
│       ├── routes/
│       │   ├── auth.routes.ts     # POST /register, POST /login, GET /me
│       │   ├── games.routes.ts    # CRUD jogos + hub social
│       │   ├── reviews.routes.ts  # Avaliações + likes + comentários
│       │   ├── lists.routes.ts    # Listas + likes + ordenação
│       │   ├── library.routes.ts  # Biblioteca (status, favoritos, vitrine)
│       │   ├── users.routes.ts    # Perfil + follow + edição + vitrine
│       │   ├── feed.routes.ts     # Feed social + trending + atividades
│       │   ├── search.routes.ts   # Busca global unificada
│       │   ├── diary.routes.ts    # Diário de sessões
│       │   └── index.ts           # Registra todas as rotas em /api
│       │
│       ├── utils/
│       │   ├── activities.ts      # logAtividade() — falha silenciosa
│       │   ├── auth.ts            # generateToken + verifyToken
│       │   ├── helpers.ts         # sanitizeUser + calcMedia
│       │   ├── prisma.ts          # Cliente Prisma singleton
│       │   └── validate.ts        # parseId + clamp
│       │
│       └── server.ts              # Express app + middlewares + start
│
└── frontend/
    └── src/
        ├── components/
        │   ├── ui.tsx             # Button, Input, Stars, Modal, GameCard, ReviewCard...
        │   ├── Layout.tsx         # Navbar responsiva (hamburger mobile + Esc)
        │   ├── SearchCommand.tsx  # Busca global dropdown (jogos + usuários + listas)
        │   └── Footer.tsx         # Rodapé com links e versão
        │
        ├── context/
        │   ├── AuthContext.tsx    # Estado global de autenticação + refreshMe
        │   └── ToastContext.tsx   # Notificações (max 3, deduplicação, auto-dismiss)
        │
        ├── hooks/
        │   └── index.ts           # useReveal, useDebounce, useLibraryMap, useClickOutside
        │
        ├── pages/
        │   ├── Landing.tsx        # Home pública (hero, stats, trending, catálogo)
        │   ├── auth/index.tsx     # Login e cadastro
        │   ├── feed/Feed.tsx      # Minhas atividades + Seguindo + Descobrir + Em alta
        │   ├── games/
        │   │   ├── Games.tsx      # Catálogo com filtros e ordenação
        │   │   └── GameDetails.tsx # Hub social do jogo
        │   ├── lists/
        │   │   ├── Lists.tsx      # Listas públicas com likes
        │   │   └── ListDetails.tsx # Detalhes + ordenação manual
        │   ├── profile/Profile.tsx # Perfil + vitrine + abas + editar
        │   ├── reviews/ReviewDetails.tsx # Review individual + comentários
        │   ├── diary/Diary.tsx    # Diário de sessões
        │   ├── library/Library.tsx # Biblioteca pessoal
        │   └── admin/Admin.tsx    # Painel admin
        │
        ├── services/api.ts        # Axios com interceptor de token
        └── types.ts               # Todos os tipos TypeScript compartilhados
```

---

## 🔌 Rotas da API

Todas as rotas têm prefixo `/api`. Autenticação via `Authorization: Bearer <token>`.

### Autenticação
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | — | Criar conta |
| POST | `/auth/login` | — | Login, retorna token + user |
| GET | `/auth/me` | ✅ | Dados do usuário logado |

### Jogos
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/games` | — | Listar com filtros (`search`, `genero`, `ano`, `sort`) |
| GET | `/games/popular` | — | Mais avaliados por período |
| GET | `/games/search?q=` | — | Busca rápida por nome |
| GET | `/games/:id` | — | Detalhe completo + avaliações + listas |
| POST | `/games` | 🛡️ Admin | Criar jogo |
| PUT | `/games/:id` | 🛡️ Admin | Editar jogo |
| DELETE | `/games/:id` | 🛡️ Admin | Excluir jogo |

### Avaliações
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/reviews` | — | Recentes (40) |
| GET | `/reviews/popular` | — | Mais curtidas por período |
| GET | `/reviews/:id` | — | Review individual |
| POST | `/reviews` | ✅ | Criar ou atualizar avaliação |
| DELETE | `/reviews/:id` | ✅ | Excluir (dono ou admin) |
| POST | `/reviews/:id/like` | ✅ | Curtir |
| DELETE | `/reviews/:id/like` | ✅ | Descurtir |
| GET | `/reviews/:id/comments` | — | Listar comentários |
| POST | `/reviews/:id/comments` | ✅ | Comentar |
| DELETE | `/reviews/comments/:id` | ✅ | Excluir comentário |

### Listas
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/lists` | — | Listas públicas |
| GET | `/lists/popular` | — | Mais curtidas |
| GET | `/lists/user/:id` | — | Listas de um usuário |
| GET | `/lists/:id` | — | Detalhe da lista |
| POST | `/lists` | ✅ | Criar lista |
| PUT | `/lists/:id` | ✅ | Editar |
| DELETE | `/lists/:id` | ✅ | Excluir |
| POST | `/lists/:id/games` | ✅ | Adicionar jogo |
| DELETE | `/lists/:id/games/:id_jogo` | ✅ | Remover jogo |
| PUT | `/lists/:id/games/order` | ✅ | Reordenar |
| POST | `/lists/:id/like` | ✅ | Curtir lista |
| DELETE | `/lists/:id/like` | ✅ | Descurtir lista |

### Usuários
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/users/search?q=` | — | Buscar por nome |
| GET | `/users/:id` | — | Perfil público completo |
| PUT | `/users/me` | ✅ | Atualizar bio, avatar, senha |
| POST | `/users/vitrine` | ✅ | Adicionar jogo à vitrine |
| DELETE | `/users/vitrine/:position` | ✅ | Remover da vitrine |
| POST | `/users/:id/follow` | ✅ | Seguir |
| DELETE | `/users/:id/unfollow` | ✅ | Deixar de seguir |

### Feed e descoberta
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/feed/stats` | — | Totais globais |
| GET | `/feed/me` | ✅ | Minhas atividades |
| GET | `/feed/following` | ✅ | Timeline de quem você segue |
| GET | `/feed/discover` | — | Atividades da comunidade |
| GET | `/feed/trending?periodo=` | — | Trending (semana/mês/todos) |

### Busca e diário
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/search?q=` | — | Busca global (jogos + usuários + listas) |
| GET | `/diary` | ✅ | Meu diário |
| POST | `/diary` | ✅ | Adicionar entrada |
| PUT | `/diary/:id` | ✅ | Editar entrada |
| DELETE | `/diary/:id` | ✅ | Excluir entrada |
| GET | `/diary/user/:id` | — | Diário público de um usuário |

---

## 🗄️ Banco de dados

### Diagrama simplificado

```
TAB_USUARIO ──┬── TAB_AVALIACAO ──── TAB_LIKE_REVIEW
              │                  └── TAB_COMENTARIO_REVIEW
              ├── TAB_LISTA ──────── TAB_LISTA_JOGO ── TAB_JOGOS
              │               └──── TAB_LIKE_LISTA
              ├── TAB_STATUS_JOGO ── TAB_JOGOS
              ├── TAB_FOLLOW
              ├── TAB_ATIVIDADE
              └── TAB_DIARIO_JOGO ── TAB_JOGOS
```

### Tabelas

| Tabela | Descrição |
|---|---|
| `TAB_USUARIO` | Usuários com tipo (`USER`/`ADMIN`) |
| `TAB_JOGOS` | Catálogo de jogos |
| `TAB_AVALIACAO` | Avaliações (única por usuário/jogo) |
| `TAB_LIKE_REVIEW` | Curtidas em avaliações |
| `TAB_COMENTARIO_REVIEW` | Comentários nas avaliações |
| `TAB_LISTA` | Listas de jogos |
| `TAB_LISTA_JOGO` | Relação lista↔jogo com posição manual |
| `TAB_LIKE_LISTA` | Curtidas em listas |
| `TAB_FOLLOW` | Relação de seguimento |
| `TAB_STATUS_JOGO` | Status de jogo na biblioteca + vitrine |
| `TAB_ATIVIDADE` | Feed de atividades sociais |
| `TAB_DIARIO_JOGO` | Entradas do diário de sessões |

### Decisões de design

- **SQLite** para desenvolvimento e apresentações. Para produção, altere `provider = "postgresql"` no schema.
- **`db push`** em vez de migrations — ideal para protótipos e ambientes acadêmicos.
- **Nota 1–10** internamente, exibida como 0.5–5.0 estrelas (divisão por 2).
- **Atividades com falha silenciosa** — se `logAtividade()` falhar, a ação principal não é afetada.

---

## ⚙️ Variáveis de ambiente

O arquivo `/backend/.env` já vem configurado para desenvolvimento:

```env
# Banco de dados SQLite
DATABASE_URL="file:./dev.db"

# Segredo do JWT — TROQUE em produção com uma string forte e aleatória
JWT_SECRET="checkpoint_v1_6_secret_minimo_32_chars_ok"
JWT_EXPIRES_IN="7d"

# Porta da API
PORT=3333

# URL do frontend (para CORS)
FRONTEND_URL="http://localhost:5173"

# Ambiente
NODE_ENV="development"

# Ignora erro de checksum Prisma em redes com proxy
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

> ⚠️ **Nunca** commite o `.env` com segredos reais em repositórios públicos.

---

## 🔧 Solução de problemas

### ❌ `@prisma/client did not initialize yet`

O cliente Prisma precisa ser gerado antes de rodar o servidor:

```bash
cd backend
npx prisma generate   # ← OBRIGATÓRIO antes do db:setup
npm run db:setup
npm run dev
```

### ❌ Download Prisma bloqueado por proxy/firewall (laboratório)

O Prisma baixa um binário nativo durante `prisma generate`. Em redes restritas:

**Opção A — Variável de ambiente:**
```bash
# Windows PowerShell
$env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
npx prisma generate
```

**Opção B — Configurar proxy do npm:**
```bash
npm config set proxy http://ENDERECO_PROXY:PORTA
npm config set https-proxy http://ENDERECO_PROXY:PORTA
```

**Opção C — Levar node_modules (mais confiável):**
1. Gere `node_modules/.prisma` em uma rede sem restrições
2. Compacte essa pasta e leve para o laboratório
3. Extraia em `backend/node_modules/.prisma`
4. Execute apenas `npm run db:setup`

### ❌ Tela em branco após login

Verifique se o backend está rodando:
```bash
curl http://localhost:3333/api/health
# deve retornar: {"status":"ok","versao":"1.6.1",...}
```

Abra o DevTools (F12) → aba Console para ver erros específicos.

### ❌ Imagens de jogos não carregam

As imagens usam o Steam CDN (`cdn.cloudflare.steamstatic.com`). Se estiver offline, os placeholders coloridos aparecem automaticamente. Para adicionar imagens locais, edite as URLs no `importData.ts` e rode `npm run db:reset`.

### ❌ Erro de CORS

Certifique-se que `FRONTEND_URL=http://localhost:5173` no `.env` do backend e que o frontend está na porta 5173.

---

## 📅 Changelog

### v1.7.0 (atual)
- **FEATURE** `BackButton` — componente global de navegação em GameDetails, ListDetails, ReviewDetails, Diary
- **FEATURE** `GamePoster` — componente padronizado para capa de jogo (`aspect-[2/3]`, `object-top`, fallback visual)
- **FEATURE** `useScrollTop` — scroll automático para o topo ao mudar de página
- **FEATURE** Campo `jogadores` em `TAB_JOGOS` (`Solo`, `Multiplayer`, etc.) + admin + seed + GameDetails
- **FEATURE** Sistema de **dislike** em avaliações via `TAB_REACAO_REVIEW` (substitui `TAB_LIKE_REVIEW`)  
  — uma reação por usuário/avaliação; clicar no mesmo botão remove; trocar substitui
- **FEATURE** CTAs da Landing condicionais: logado vê "Ver meu feed", deslogado vê "Criar conta"
- **FEATURE** `VitrineSection` + `VitrineEditor` + `VitrineCard` — vitrine modularizada com editor inline
- **FEATURE** `DiaryEntryCard` + `DiaryMonthGroup` + `DiaryFormModal` — diário modularizado
- **FEATURE** `EditProfileModal` com preview ao vivo do avatar, botão limpar foto e aba separada para senha
- **IMPROVEMENT** `"Quero jogar"` removido dos botões de ação rápida da UI (mantido no banco)
- **IMPROVEMENT** Versão da API atualizada para `1.7.0` no healthcheck
- **IMPROVEMENT** Todas as páginas com `BackButton` para navegação consistente

### v1.6.1 (atual)
- **CRITICAL FIX** Reordenamento de rotas em `users.routes.ts`: `/me`, `/vitrine`, `/search` agora ficam antes de `/:id`, eliminando bugs de perfil sem login, edição de avatar e vitrine
- **CRITICAL FIX** Reordenamento em `reviews.routes.ts`: `/popular` e `/comments/:id` antes de `/:id`
- **FIX** Validação de data futura em avaliações (backend + frontend)
- **FIX** Toast duplicado no cadastro eliminado com limpeza de `location.state`
- **FIX** Toast com deduplicação (mesma mensagem não repete) e máximo de 3 simultâneos
- **FIX** Clique nas listas não propagava para o botão de like (`stopPropagation`)
- **FIX** ReviewCard no perfil agora inclui `usuario` corretamente (backend retorna objeto completo)
- **FIX** Avatar aceita string vazia para limpar foto
- **FEATURE** `PasswordInput` com toggle mostrar/ocultar senha em login, cadastro e alteração
- **FEATURE** Ícone do seletor de data agora aparece em verde no tema escuro
- **FEATURE** Vitrine vazia no próprio perfil exibe CTA "Montar Vitrine" com modal de busca
- **FEATURE** Feed com nova aba "Minhas atividades" (`GET /feed/me`)
- **IMPROVEMENT** `errorMiddleware` com tratamento detalhado de erros Prisma
- **IMPROVEMENT** `postinstall` removido do `package.json` (evita problemas em redes bloqueadas)
- **IMPROVEMENT** `@types/express` fixado na versão 4.x

### v1.6.0
- Feed de atividades sociais (`TAB_ATIVIDADE`) com 8 tipos de ação
- Trending: jogos + reviews + listas por período
- Likes em listas com contador
- Busca global unificada (jogos + usuários + listas)
- Página de review individual com comentários
- Diário de jogos agrupado por mês
- GameDetails como hub social
- Perfil com vitrine, estatísticas visuais e abas
- Ordenação manual de listas
- Navbar mobile com hamburger
- Fix crítico: `useReveal` adicionava `active` mas CSS esperava `show`

### v1.5.0
- Likes em avaliações
- Distribuição de notas em barras
- Perfil público com `optionalAuth`
- Admin com 3 abas
- Footer em todas as páginas
- Página 404
- Meia estrela no sistema de avaliação

---

<div align="center">

Feito com ☕ e muito ~~bug fix~~ carinho.

**Checkpoint** · UNIEURO 2025/2026

</div>

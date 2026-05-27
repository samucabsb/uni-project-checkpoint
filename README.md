# Checkpoint v1.4

Rede social de jogos — avalie, liste, siga e descubra. Projeto Integrador UNIEURO.

> **Stack:** React 18 · TypeScript · Vite · Tailwind CSS · React Query · Axios  
> **Backend:** Node.js · Express · Prisma ORM · SQLite · JWT · Bcrypt · Zod

---

## Instalação e execução

### Pré-requisitos

- Node.js 18+ instalado
- npm 9+ instalado
- Nenhum Docker necessário — banco de dados é SQLite local

### 1. Backend

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate    
npm run db:seed        
npm run dev         
```

### 2. Frontend (novo terminal)

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador.

---

## Contas de teste

| Usuário | Senha | Perfil |
|---|---|---|
| `admin` | `admin123` | Administrador |
| `gamer_br` | `senha123` | Usuário comum |
| `player_one` | `senha123` | Usuário comum |
| `casual_gamer` | `senha123` | Usuário comum |

---

## Variáveis de ambiente

Arquivo: `backend/.env`

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Caminho do banco SQLite |
| `JWT_SECRET` | `checkpoint_v1_4_secret` | Segredo para assinar tokens |
| `JWT_EXPIRES_IN` | `7d` | Tempo de expiração do token |
| `PORT` | `3333` | Porta da API |
| `FRONTEND_URL` | `http://localhost:5173` | URL do frontend (CORS) |

> ⚠️ Para produção, troque o `JWT_SECRET` por uma string longa e aleatória.

---

## Scripts disponíveis

### Backend

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia com hot reload (tsx watch) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run start` | Inicia versão compilada |
| `npm run db:generate` | Gera cliente Prisma |
| `npm run db:migrate` | Executa migrações pendentes |
| `npm run db:seed` | Popula banco com dados iniciais |
| `npm run db:studio` | Abre Prisma Studio (visualizador do banco) |
| `npm run db:reset` | Apaga e recria o banco |
| `npm run db:export` | Exporta dados para JSON |
| `npm run db:backup` | Faz backup dos dados |

### Frontend

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia Vite dev server com proxy |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |

---

## Arquitetura

```
checkpoint_v1.4/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         ← Modelos do banco de dados
│   │   ├── importData.ts         ← Script de seed
│   │   └── data/                 ← Dados iniciais em JSON
│   └── src/
│       ├── routes/               ← Uma rota por domínio
│       │   ├── auth.routes.ts
│       │   ├── games.routes.ts   ← CRUD completo (admin)
│       │   ├── reviews.routes.ts
│       │   ├── lists.routes.ts
│       │   ├── library.routes.ts ← Favoritos + Vitrine
│       │   ├── users.routes.ts   ← Inclui GET /users/search
│       │   ├── feed.routes.ts    ← discover + following
│       │   └── index.ts          ← Monta todos os roteadores
│       ├── middlewares/
│       │   ├── authMiddleware.ts ← Verifica JWT
│       │   └── errorMiddleware.ts← Handler global de erros
│       └── utils/
│           ├── prisma.ts         ← Instância global do Prisma
│           ├── auth.ts           ← generateToken / verifyToken
│           └── helpers.ts        ← sanitize / calcMedia
└── frontend/
    └── src/
        ├── pages/                ← Uma pasta por página
        │   ├── Landing.tsx
        │   ├── auth/
        │   ├── feed/             ← Seguindo + Descobrir c/ busca de usuários
        │   ├── games/
        │   ├── library/          ← Favoritos + Vitrine
        │   ├── lists/
        │   ├── profile/          ← CRUD da Vitrine para o dono
        │   └── admin/            ← CRUD completo de jogos
        ├── components/
        │   ├── Layout.tsx        ← Navbar + Guards de rota
        │   ├── SearchCommand.tsx ← Busca global de jogos
        │   └── ui.tsx            ← Button, Input, GameCard, Modal...
        ├── context/
        │   ├── AuthContext.tsx   ← JWT + race condition corrigida
        │   └── ToastContext.tsx
        ├── hooks/
        │   └── index.ts          ← useDebounce, useReveal, useLibraryMap
        ├── services/
        │   └── api.ts            ← Axios c/ proxy (sem URL hardcoded)
        └── types.ts              ← Tipos TypeScript compartilhados
```

---

## Funcionalidades por versão

### v1.4 (atual)
- **Vitrine** no perfil — 4 slots gerenciáveis (adicionar/remover/reordenar)
- **Feed/Descobrir** — busca de usuários + seção "Jogadores da comunidade"
- **Admin CRUD** — criar, editar inline e excluir jogos com confirmação
- Seção de avaliações removida do Admin (não faz sentido administrativo)
- Utilitários `sanitize` e `calcMedia` centralizados em `helpers.ts`
- Rota `GET /users/search` para busca de usuários
- Rota `/feed/discover` retorna usuários ativos
- Transação atômica no `PUT /library/vitrine`
- Renomeação: "Top 4" → "Vitrine" em todo o sistema

### v1.3
- Bugs críticos corrigidos (feed following, AuthContext race condition, img null)
- Código separado em arquivos por página (fim do monolito)
- URL da API usando proxy Vite (sem hardcode)
- Feed seguindo retorna vazio quando sem follows
- Filtros com dropdowns no catálogo
- SearchCommand com debounce e navegação por teclado
- Avatar com fallback automático
- Modal de confirmação em vez de browser confirm()
- Skeleton loading nas páginas

### v1.2
- Adição de jogo pela página da lista
- Data atual como padrão na avaliação
- Home diferente para logado vs visitante
- Favoritos com coração verde + CRUD
- Sistema de avatar
- Edição de perfil completa
- Scroll animations

---

## Modelo de dados (resumo)

| Tabela | Propósito |
|---|---|
| `TAB_USUARIO` | Usuários, avatars, bio, tipo |
| `TAB_JOGOS` | Catálogo de jogos |
| `TAB_AVALIACAO` | Avaliações (1 por usuário por jogo) |
| `TAB_LISTA` | Listas curadas de jogos |
| `TAB_LISTA_JOGO` | Relação N:N entre lista e jogo |
| `TAB_FOLLOW` | Relação de seguimento entre usuários |
| `TAB_STATUS_JOGO` | Status, favorito e posição na Vitrine |

A coluna `top_position` em `TAB_STATUS_JOGO` armazena a posição na Vitrine (1–4 ou null).

---

## API — Principais endpoints

```
GET  /api/health                         Status da API
POST /api/auth/register                  Criar conta
POST /api/auth/login                     Login
GET  /api/auth/me                        Perfil logado

GET  /api/games?search=&genero=&ano=     Listar jogos
GET  /api/games/search?q=                Autocomplete
GET  /api/games/:id                      Detalhes + avaliações
POST /api/games                          Criar (admin)
PUT  /api/games/:id                      Editar (admin)
DELETE /api/games/:id                    Excluir (admin)

GET  /api/users/search?q=                Buscar usuários (novo v1.4)
GET  /api/users/:id                      Perfil completo
PUT  /api/users/:id                      Editar perfil
POST /api/users/:id/follow               Seguir
DELETE /api/users/:id/follow             Deixar de seguir
PUT  /api/users/:id/tipo                 Promover/rebaixar (admin)

GET  /api/feed/discover                  Atividades + usuários ativos
GET  /api/feed/following                 Feed de seguidos

GET  /api/library?status=                Minha biblioteca
POST /api/library/games/:id/status       Atualizar status
POST /api/library/games/:id/favorite     Favoritar
DELETE /api/library/games/:id/favorite   Desfavoritar
PUT  /api/library/vitrine                Salvar Vitrine (v1.4)

GET  /api/lists?search=                  Listas públicas
POST /api/lists                          Criar lista
POST /api/lists/:id/games               Adicionar jogo à lista
DELETE /api/lists/:id/games/:id_jogo    Remover jogo da lista

GET  /api/admin/dashboard               Métricas (admin)
```

---

## Observações técnicas

- **SQLite**: banco de dados em arquivo local, zero configuração. Para produção, migrar para PostgreSQL alterando o `provider` no `schema.prisma`.
- **Proxy Vite**: o frontend usa `baseURL: '/api'`. O `vite.config.ts` redireciona para `localhost:3333`. Sem URL hardcoded.
- **React Query**: cache automático de 60s, retry 1 vez, sem refetch ao focar janela.
- **JWT**: tokens de 7 dias. O interceptor do Axios redireciona para `/login` em caso de 401.
- **Vitrine**: a rota `PUT /library/vitrine` recebe o estado completo (até 4 slots) e substitui tudo em transação atômica. O cliente deve sempre enviar todos os slots desejados.

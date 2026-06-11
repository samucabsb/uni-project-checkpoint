<div align="center">

# 🎮 Checkpoint

**Uma rede social para gamers avaliarem, organizarem e descobrirem jogos.**

Inspirado no modelo social do Letterboxd, o Checkpoint permite registrar sua jornada gamer,
avaliar jogos com meia estrela, criar listas temáticas, montar uma vitrine de favoritos,
seguir outros jogadores e acompanhar atividades da comunidade em tempo real.

---

![Version](https://img.shields.io/badge/versão-1.10.0-22c55e?style=for-the-badge)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb?style=for-the-badge)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933?style=for-the-badge)
![Database](https://img.shields.io/badge/banco-Prisma%20%2B%20SQLite-2d3748?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/linguagem-TypeScript-3178c6?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Fase%202%20Paralela-22c55e?style=for-the-badge)

**UNIEURO — Projeto Integrador de Computação Paralela**  
Samuel · Vinícius · Ana Júlia  
Prof. Jorge Osvaldo A. L. Torres

</div>

---

## 📋 Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Novidades v1.10 — Concorrência e Paralelismo](#-novidades-v110--concorrência-e-paralelismo)
- [Arquitetura](#-arquitetura)
- [Instalação e execução](#-instalação-e-execução)
- [Scripts disponíveis](#-scripts-disponíveis)
- [Usuários de teste](#-usuários-de-teste)
- [Testando concorrência](#-testando-concorrência)
- [Testando paralelismo](#-testando-paralelismo)
- [Rotas da API](#-rotas-da-api)
- [Banco de dados](#-banco-de-dados)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Evidências para apresentação](#-evidências-para-apresentação)

---

## 🎯 Sobre o projeto

O **Checkpoint** nasceu como projeto integrador da UNIEURO com o objetivo de unir desenvolvimento full stack com um produto que simule o mercado real. A inspiração principal é o [Letterboxd](https://letterboxd.com/) — uma rede social para cinema — adaptada para o universo dos videogames.

---

## 🆕 Novidades v1.10 — Concorrência e Paralelismo

### Concorrência validada

| Cenário | Rota | Comportamento |
|---|---|---|
| Avaliação duplicada | `POST /reviews` | `409 Conflict` com mensagem clara |
| Follow duplicado | `POST /users/:id/follow` | `409 Conflict` com mensagem clara |
| Multi-usuário simultâneo | `POST /reviews` | Todos os usuários conseguem criar suas próprias avaliações |

**Logs gerados automaticamente:**
```
[CONCORRÊNCIA] Iniciando POST /reviews | user: 2 | jogo: 4
[CONCORRÊNCIA] POST /reviews concluído | user: 2 | jogo: 4 | ação: CREATE
[CONCORRÊNCIA] Conflito detectado em POST /reviews | user: 2 | jogo: 4 → 409
[CONCORRÊNCIA] Iniciando follow | seguidor: 2 → seguido: 1
[CONCORRÊNCIA] Conflito em follow | seguidor: 2 → seguido: 1 → 409
```

### Paralelismo implementado

**Arquitetura fila + worker (desacoplada da requisição HTTP):**

```
Usuário pesquisa jogo
        ↓
GET /api/games?search=elden
        ↓
Backend responde imediatamente com os jogos   ← Usuário já recebeu a resposta
        ↓
addSearchJob() → fila em memória              ← Execução paralela começa aqui
        ↓
searchWorker (setInterval 1s)                 ← Worker independente
        ↓
prisma.tAB_BUSCA_JOGO.create()                ← Persiste métricas no banco
```

**Logs gerados automaticamente:**
```
[QUEUE]  Job adicionado | termo: "Elden Ring" | fila: 1 | total: 1
[WORKER] ⚙️  Processando | termo: "Elden Ring" | resultados: 1 | fila restante: 0
[WORKER] ✅ Busca registrada | termo: "Elden Ring" | usuário: 2
```

---

## 📐 Arquitetura

```
Frontend (React/Vite)
        ↓ HTTP (Axios + JWT)
Backend (Express/TypeScript)
    ├── routes/
    │   ├── games.routes.ts      → busca de jogos + addSearchJob()
    │   ├── reviews.routes.ts    → avaliações + logs concorrência
    │   └── users.routes.ts      → follow + 409 em conflito
    │
    ├── queue/
    │   └── searchQueue.ts       → fila FIFO em memória (Producer)
    │
    ├── workers/
    │   └── searchWorker.ts      → worker background setInterval (Consumer)
    │
    └── prisma/
        └── schema.prisma        → TAB_BUSCA_JOGO (nova em v1.10)
                ↓
        SQLite (dev.db)
```

**Separação de responsabilidades (Pilar 4 — Distribuição):**
- `routes/` — camada HTTP, responde ao usuário
- `queue/` — fila desacoplada
- `workers/` — processamento em background, independente das requisições

---

## 🚀 Instalação e execução

### 1. Extraia o projeto

```bash
unzip checkpoint_v1_10.zip
cd checkpoint_v1_10
```

### 2. Configure e inicie o backend

```bash
cd backend

# Instala dependências
npm install

# OBRIGATÓRIO — gera o cliente Prisma (necessário após mudança no schema)
npx prisma generate

# Cria o banco SQLite + nova tabela TAB_BUSCA_JOGO + popula com dados de teste
npm run db:setup

# Inicia o servidor em modo desenvolvimento (hot-reload)
npm run dev
# → API rodando em http://localhost:3333
# → Worker de paralelismo iniciado automaticamente
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
| `npm run dev` | `tsx watch src/server.ts` | Servidor com hot-reload + worker automático |
| `npm run build` | `tsc` | Compila TypeScript |
| `npm start` | `node dist/server.js` | Inicia build de produção |
| `npm run db:setup` | `prisma db push && tsx prisma/importData.ts` | Cria banco + popula seed |
| `npm run db:reset` | `prisma db push --force-reset && tsx prisma/importData.ts` | Reseta e repopula |
| `npm run db:studio` | `prisma studio` | Interface visual do banco em localhost:5555 |
| `npm run test:concurrency` | `tsx src/tests/concurrency-test.ts` | **Suite completa de testes de concorrência** |

### Frontend (`/frontend`)

| Script | Comando interno | Descrição |
|---|---|---|
| `npm run dev` | `vite` | Dev server com HMR |
| `npm run build` | `tsc && vite build` | Build de produção em `/dist` |
| `npm run preview` | `vite preview` | Preview do build local |

---

## 👤 Usuários de teste

| Usuário | Senha | Tipo | Observações |
|---|---|---|---|
| `admin` | `admin123` | 🛡️ Admin | Acesso ao painel admin |
| `gamer_br` | `senha123` | Usuário | 6 avaliações, vitrine completa |
| `player_one` | `senha123` | Usuário | Especialista em FPS e indies |
| `casual_gamer` | `senha123` | Usuário | Gosta de histórias |

---

## 🧪 Testando concorrência

### Método 1 — Script automatizado (recomendado para evidência)

```bash
cd backend
npm run test:concurrency
```

**Output esperado:**
```
============================================================
CENÁRIO 1 — Conflito de avaliação simultânea
Usuário: gamer_br | Jogo: Elden Ring
Disparando 10 requisições simultâneas...
============================================================
  [1] ✅ 201 — Avaliação criada
  [2] ⚠️  409 — Conflito detectado (esperado)
  [3] ⚠️  409 — Conflito detectado (esperado)
  ...
📊 Resultado:
   Sucessos (201/200): 1
   Conflitos (409):    9
   Duração:            ~50ms
✅ CONSISTÊNCIA MANTIDA
```

### Método 2 — Visual com navegadores (para apresentação ao vivo)

1. Abra 3 navegadores/abas anônimas
2. Logue com `gamer_br`, `player_one` e `casual_gamer`
3. Todos acessam a página do Elden Ring simultaneamente
4. Avaliam o jogo ao mesmo tempo
5. Observe o comportamento no terminal do backend

---

## ⚡ Testando paralelismo

### Verificar worker em ação

1. Inicie o backend (`npm run dev`)
2. Observe no terminal:
   ```
   [WORKER] 🚀 Worker de busca iniciado — processando a cada 1s
   ```
3. Faça uma busca no frontend (campo de pesquisa)
4. Observe os logs:
   ```
   [QUEUE]  Job adicionado | termo: "Elden" | fila: 1
   [WORKER] ⚙️  Processando | termo: "Elden" | resultados: 3
   [WORKER] ✅ Busca registrada | termo: "Elden" | usuário: 2
   ```

### Verificar métricas no banco

```bash
npm run db:studio
# Abra http://localhost:5555
# Navegue até TAB_BUSCA_JOGO
# Veja os registros sendo criados em tempo real
```

### Verificar estatísticas da fila via API

```
GET http://localhost:3333/api/queue/stats
```

Resposta:
```json
{
  "pendentes": 0,
  "adicionados": 5,
  "processados": 5,
  "timestamp": "2026-06-09T20:00:00.000Z"
}
```

---

## 🗄️ Banco de dados

### Diagrama

```
TAB_USUARIO ──┬── TAB_AVALIACAO ──── TAB_REACAO_REVIEW
              │                  └── TAB_COMENTARIO_REVIEW
              ├── TAB_LISTA ──────── TAB_LISTA_JOGO ── TAB_JOGOS
              │               └──── TAB_LIKE_LISTA
              ├── TAB_STATUS_JOGO ── TAB_JOGOS
              ├── TAB_FOLLOW
              ├── TAB_ATIVIDADE
              ├── TAB_DIARIO_JOGO ── TAB_JOGOS
              └── TAB_BUSCA_JOGO    ← NOVA v1.10 (worker de paralelismo)
```

### Nova tabela v1.10

| Tabela | Descrição |
|---|---|
| `TAB_BUSCA_JOGO` | Métricas de buscas processadas pelo worker em background |

---

## ⚙️ Variáveis de ambiente

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="checkpoint_v1_10_secret_minimo_32_chars_ok"
JWT_EXPIRES_IN="7d"
PORT=3333
FRONTEND_URL="http://localhost:5173"
```

---

## 📊 Evidências para apresentação

### O que mostrar ao professor

| Momento | O que mostrar | Onde ver |
|---|---|---|
| Funcionalidade | Sistema rodando, fluxo completo | Navegador |
| Arquitetura | Diagrama de componentes | Este README / slide |
| Concorrência | Script `npm run test:concurrency` | Terminal |
| Paralelismo | Worker logs durante busca | Terminal |
| Distribuição | Fila separada do handler HTTP | Código `queue/` e `workers/` |
| Banco | `TAB_BUSCA_JOGO` populada pelo worker | Prisma Studio |
| Stats | `GET /api/queue/stats` | Navegador/Insomnia |

### Roteiro sugerido (7 pontos do professor)

1. **Objetivo** — "Rede social para gamers, inspirada no Letterboxd"
2. **Arquitetura** — mostrar o diagrama acima
3. **Sistema rodando** — abrir o frontend, fazer login
4. **Fluxo principal** — avaliar um jogo, criar lista, seguir usuário
5. **Concorrência ao vivo** — `npm run test:concurrency` no terminal
6. **Paralelismo** — buscar um jogo e mostrar os `[QUEUE]` e `[WORKER]` logs
7. **Evidência de teste** — mostrar `TAB_BUSCA_JOGO` no Prisma Studio + output do script

---

## 📝 Changelog

### v1.10.0 — Computação Paralela (atual)
- ✅ `searchQueue.ts` — fila FIFO em memória (Producer)
- ✅ `searchWorker.ts` — worker background com `setInterval` (Consumer)
- ✅ `TAB_BUSCA_JOGO` — nova tabela de métricas de busca
- ✅ `concurrency-test.ts` — suite de 3 cenários de teste repetíveis
- ✅ `POST /reviews` — logs de concorrência + captura explícita P2002 → 409
- ✅ `POST /users/:id/follow` — usa `create` em vez de `upsert` para expor conflito
- ✅ `GET /api/queue/stats` — endpoint de diagnóstico da fila
- ✅ `npm run test:concurrency` — script de teste via npm
- ✅ Logs prefixados: `[QUEUE]`, `[WORKER]`, `[CONCORRÊNCIA]`

### v1.9.2
- FIX: admin não pode mais editar/excluir entradas de diário alheias

### v1.9.0 – v1.7.0
- Reações (LIKE/DISLIKE), diário, campo jogadores, busca global

### v1.6.x
- Base: autenticação JWT, feed social, vitrine, listas, avaliações

<div align="center">

# 🎮 Checkpoint v1.10.4

**Rede social para gamers avaliarem, organizarem e descobrirem jogos.**

Projeto Integrador de Computação Paralela — UNIEURO  
Samuel · Vinícius · Ana Júlia

</div>

---

## Sobre o projeto

O **Checkpoint** é uma rede social de jogos inspirada no modelo do Letterboxd. O sistema permite autenticação, catálogo de jogos, avaliações, listas, diário, vitrine de favoritos, follow entre usuários e feed social.

A versão **v1.10.4** fortalece a entrega de Computação Paralela com:

- concorrência validada com múltiplas requisições simultâneas;
- conflito real tratado com `409 Conflict`;
- fila persistente em banco de dados;
- worker executado em processo separado;
- logs e evidências repetíveis para apresentação.

---

## Arquitetura

```text
Frontend React/Vite/TypeScript
        ↓ HTTP + JWT
Backend Express/TypeScript
        ↓ Prisma
SQLite/PostgreSQL
```

### Concorrência

```text
Múltiplas requisições simultâneas
        ↓
POST /reviews ou POST /users/:id/follow
        ↓
Constraint única no banco
        ↓
1 sucesso + conflitos 409
        ↓
Dados permanecem consistentes
```

### Paralelismo/distribuição mínima v1.10.4

```text
Terminal 1 — API Express
GET /api/games/search?q=atomic
        ↓
API responde ao usuário
        ↓
Job salvo em TAB_FILA_BUSCA

Terminal 2 — Worker separado
Lê TAB_FILA_BUSCA
        ↓
PENDENTE → PROCESSANDO → CONCLUIDO
        ↓
Registra métrica em TAB_BUSCA_JOGO
```

A comunicação entre API e worker acontece pela tabela persistente `TAB_FILA_BUSCA`. Isso evita fila apenas em memória e permite evidência real no banco.

---

## Requisitos

- Node.js 20+
- npm
- Prisma
- SQLite em desenvolvimento

---

## Instalação

```bash
cd backend
npm install
npx prisma generate
npm run db:setup
npm run dev
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## Execução em desenvolvimento

### Terminal 1 — API

```bash
cd backend
npm run dev:api
```

API disponível em:

```text
http://localhost:3333
```

### Terminal 2 — Worker

```bash
cd backend
npm run dev:worker
```

O worker consome jobs da `TAB_FILA_BUSCA` e grava métricas em `TAB_BUSCA_JOGO`.

### Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

Frontend disponível em:

```text
http://localhost:5173
```

---

## Scripts do backend

```bash
npm run dev              # API em modo desenvolvimento
npm run dev:api          # API em modo desenvolvimento
npm run dev:worker       # Worker separado em modo desenvolvimento
npm run build            # Compila TypeScript
npm start                # Executa API compilada
npm run start:worker     # Executa worker compilado
npm run db:setup         # Sincroniza schema e popula seed
npm run db:reset         # Reseta banco e popula seed
npm run db:studio        # Abre Prisma Studio
npm run test:concurrency # Executa testes de concorrência
```

---

## Variáveis de ambiente

Crie `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="checkpoint_v1_10_4_secret_minimo_32_chars_ok"
JWT_EXPIRES_IN="7d"
PORT=3333
FRONTEND_URL="http://localhost:5173"
SEARCH_WORKER_INTERVAL_MS=1000
```

---

## Usuários de teste

| Usuário | Senha | Tipo |
|---|---|---|
| `admin` | `admin123` | Admin |
| `gamer_br` | `senha123` | Usuário |
| `player_one` | `senha123` | Usuário |
| `casual_gamer` | `senha123` | Usuário |

---

## Teste de concorrência

Execute com a API rodando:

```bash
cd backend
npm run test:concurrency
```

Cenários validados:

1. **10 avaliações simultâneas do mesmo usuário para o mesmo jogo**  
   Resultado esperado: `1` sucesso e `9` conflitos `409`.

2. **3 usuários diferentes avaliando o mesmo jogo simultaneamente**  
   Resultado esperado: `3` sucessos.

3. **5 follows simultâneos para o mesmo perfil**  
   Resultado esperado: `1` sucesso e `4` conflitos `409`.

A consistência é garantida por constraints no banco e tratamento explícito de `P2002 → 409 Conflict`.

---

## Teste de paralelismo

1. Rode a API:

```bash
npm run dev:api
```

2. Rode o worker em outro terminal:

```bash
npm run dev:worker
```

3. Faça uma busca no frontend ou via API:

```text
GET http://localhost:3333/api/games/search?q=atomic
```

4. Verifique logs esperados:

```text
[QUEUE] Job persistido | id: 1 | termo: "atomic" | status: PENDENTE
[WORKER] Job capturado | id: 1 | termo: "atomic"
[WORKER] Job concluído | id: 1 | destino: TAB_BUSCA_JOGO
```

5. Consulte estatísticas:

```text
GET http://localhost:3333/api/queue/stats
```

Exemplo:

```json
{
  "pendentes": 0,
  "processando": 0,
  "processados": 5,
  "erros": 0,
  "adicionados": 5
}
```

6. Abra o Prisma Studio:

```bash
npm run db:studio
```

Verifique:

- `TAB_FILA_BUSCA`: jobs e status da fila;
- `TAB_BUSCA_JOGO`: métricas processadas pelo worker.

---

## Banco de dados

Tabelas relevantes para Computação Paralela:

| Tabela | Função |
|---|---|
| `TAB_AVALIACAO` | Avaliações com constraint única por usuário/jogo |
| `TAB_FOLLOW` | Relação seguidor/seguido com chave composta |
| `TAB_FILA_BUSCA` | Fila persistente de jobs de busca |
| `TAB_BUSCA_JOGO` | Métricas finais processadas pelo worker |

---

## Evidências para apresentação

Mostrar ao professor:

1. sistema rodando no navegador;
2. fluxo principal: login → buscar jogo → avaliar → feed;
3. terminal com `npm run test:concurrency`;
4. terminal da API com `[QUEUE] Job persistido`;
5. terminal do worker com `[WORKER] Job capturado` e `[WORKER] Job concluído`;
6. Prisma Studio mostrando `TAB_FILA_BUSCA` e `TAB_BUSCA_JOGO`;
7. `GET /api/queue/stats` com contadores reais.

---

## Observações técnicas

- A fila não é mais um array em memória.
- A API e o worker rodam em processos separados.
- A requisição principal não depende da gravação da métrica.
- A concorrência crítica continua protegida por constraints no banco.
- Em produção, a `TAB_FILA_BUSCA` poderia evoluir para Redis, BullMQ ou RabbitMQ sem mudar o contrato das rotas.

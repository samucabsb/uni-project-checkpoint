# Checkpoint V1.2 Final

Rede social de jogos com catálogo, avaliações, listas, biblioteca pessoal, favoritos, Top 4, perfil editável, busca inteligente e painel admin.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind, React Router, Axios, TanStack React Query.
- Backend: Node.js, Express, TypeScript, Prisma, SQLite, JWT, Bcrypt, Zod.
- Sem Docker.

## Rodar o projeto

### Backend

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

API: `http://localhost:3333`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## Usuários de teste

```txt
admin / admin123
gamer_br / senha123
player_one / senha123
casual_gamer / senha123
```

## Principais melhorias da V1.2 Final

- Rotas em inglês com aliases em português.
- Busca global com dropdown e debounce.
- Filtros de catálogo com dropdowns.
- Busca de listas da comunidade.
- Página de lista permite adicionar/remover jogos.
- Avaliação usa data atual como padrão.
- Home muda quando usuário está logado.
- Scroll animations leves com CSS/Intersection Observer.
- Favoritos gerais separados do Top 4 do perfil.
- Coração verde nos cards favoritados.
- CRUD de favoritos.
- Configuração de Top 4.
- Perfil editável com seleção de avatar.
- Código modular.

## Persistência e GitHub

O SQLite local fica em `backend/prisma/dev.db` e não deve ir para o GitHub. Para versionar dados oficiais:

```bash
cd backend
npm run db:export
cd ..
git add backend/prisma/data
git commit -m "Atualiza dados oficiais"
git push
```

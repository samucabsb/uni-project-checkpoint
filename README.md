# Checkpoint V1.1

Checkpoint V1.1 é uma rede social acadêmica/profissional para jogos, inspirada em experiências de catálogo social como Letterboxd: catálogo, avaliações, listas, feed, perfil, biblioteca pessoal, favoritos e status de jogo.

A V1.1 prioriza **estabilidade, usabilidade e apresentação profissional**:

- Cadastro não faz login automático: após criar conta, o usuário volta para a tela de login.
- Feedback visual com toasts para ações importantes.
- Botões com estado de loading.
- Página inicial pública mais completa.
- Página de jogo com “Minha avaliação” separada das avaliações da comunidade.
- Biblioteca pessoal com status: Quero jogar, Jogando, Zerado, Abandonado e Favorito.
- Top 4 jogos favoritos no perfil.
- Listas com página individual e mosaico visual.
- Feed com atividades recentes.
- Admin com CRUD de jogos, usuários, avaliações e métricas.
- SQLite local, sem Docker.
- Seed inteligente, export/import e backup do banco.

## Como rodar

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
samuel / user123
vinicius / user123
anajulia / user123
```

## Persistência

O banco local fica em:

```txt
backend/prisma/dev.db
```

Fechar o terminal não apaga os dados. Para versionar dados oficiais no GitHub:

```bash
cd backend
npm run db:export
git add .
git commit -m "Atualiza dados oficiais"
git push
```

Em outra máquina:

```bash
npm run db:migrate
npm run db:import
```

## Scripts úteis

```bash
npm run db:seed    # importa dados iniciais sem apagar o banco
npm run db:export  # exporta dados atuais para JSON
npm run db:import  # importa JSONs oficiais
npm run db:backup  # cria backup do SQLite
npm run db:reset   # recria banco local
```

## Estrutura

```txt
checkpoint_v1_1/
  backend/
    prisma/
      schema.prisma
      data/
      importData.ts
      exportData.ts
      backup.ts
      reset.ts
    src/
      routes/
      middlewares/
      utils/
      server.ts
  frontend/
    src/
      components/
      context/
      pages/
      services/
      App.tsx
      main.tsx
```

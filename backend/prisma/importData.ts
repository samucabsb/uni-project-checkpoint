/**
 * Seed de dados — Checkpoint v1.5
 *
 * IMPORTANTE: nota agora é escala 1-10 (meia estrela)
 * 1=0.5★  2=1.0★  3=1.5★  4=2.0★  5=2.5★
 * 6=3.0★  7=3.5★  8=4.0★  9=4.5★  10=5.0★
 *
 * Para rodar: npm run db:seed
 * Para setup completo: npm run db:setup
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Iniciando seed do banco de dados...\n');

  // Limpa dados existentes (ordem importa por FK)
  await prisma.tAB_LIKE_REVIEW.deleteMany();
  await prisma.tAB_STATUS_JOGO.deleteMany();
  await prisma.tAB_LISTA_JOGO.deleteMany();
  await prisma.tAB_LISTA.deleteMany();
  await prisma.tAB_AVALIACAO.deleteMany();
  await prisma.tAB_FOLLOW.deleteMany();
  await prisma.tAB_JOGOS.deleteMany();
  await prisma.tAB_USUARIO.deleteMany();

  console.log('✅ Banco limpo\n');

  // ── Usuários ────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('senha123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  const [admin, gamer, player, casual] = await Promise.all([
    prisma.tAB_USUARIO.create({
      data: {
        nm_usuario:    'admin',
        email_usuario: 'admin@checkpoint.com',
        senha_usuario: adminHash,
        tipo_usuario:  'ADMIN',
        bio_usuario:   'Administrador do Checkpoint.',
        img_usuario:   'https://api.dicebear.com/8.x/adventurer/svg?seed=admin',
      },
    }),
    prisma.tAB_USUARIO.create({
      data: {
        nm_usuario:    'gamer_br',
        email_usuario: 'gamer@checkpoint.com',
        senha_usuario: senhaHash,
        bio_usuario:   'Jogador hardcore. Zerador compulsivo. RPG é vida.',
        img_usuario:   'https://api.dicebear.com/8.x/adventurer/svg?seed=knight',
      },
    }),
    prisma.tAB_USUARIO.create({
      data: {
        nm_usuario:    'player_one',
        email_usuario: 'player@checkpoint.com',
        senha_usuario: senhaHash,
        bio_usuario:   'FPS competitivo e jogos indie. Sempre buscando o próximo desafio.',
        img_usuario:   'https://api.dicebear.com/8.x/adventurer/svg?seed=ninja',
      },
    }),
    prisma.tAB_USUARIO.create({
      data: {
        nm_usuario:    'casual_gamer',
        email_usuario: 'casual@checkpoint.com',
        senha_usuario: senhaHash,
        bio_usuario:   'Jogo nos fins de semana. Gosto de história e mundo aberto.',
        img_usuario:   'https://api.dicebear.com/8.x/adventurer/svg?seed=explorer',
      },
    }),
  ]);

  console.log('✅ Usuários criados');

  // ── Follows ─────────────────────────────────────────────
  await Promise.all([
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: gamer.id_usuario,   id_usuario_seguido: player.id_usuario  } }),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: gamer.id_usuario,   id_usuario_seguido: casual.id_usuario  } }),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: player.id_usuario,  id_usuario_seguido: gamer.id_usuario   } }),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: casual.id_usuario,  id_usuario_seguido: gamer.id_usuario   } }),
  ]);

  console.log('✅ Follows criados');

  // ── Jogos ───────────────────────────────────────────────
  const jogosData = [
    { nm_jogo: 'Elden Ring',                  img_jogo: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/aGhoS3PubSFREmrFIXGsSREI.png', genero: 'RPG de Ação',    plataforma: 'PC / PS5 / Xbox', classificacao: '16+', descricao: 'Um RPG de ação épico em um vasto mundo aberto, criado em parceria com George R. R. Martin. Explore as Terras Intermediárias e confronte desafios sobrenaturais.', dt_jogo: '2022-02-25' },
    { nm_jogo: 'The Witcher 3',               img_jogo: 'https://image.api.playstation.com/vulcan/img/rnd/202010/0417/p9nOBBSMEfmMOq6VHHkUQPOm.png', genero: 'RPG de Ação',    plataforma: 'PC / PS5 / Xbox', classificacao: '18+', descricao: 'Um dos maiores RPGs já criados. Geralt de Rívia busca sua filha adotiva em um mundo devastado pela guerra.', dt_jogo: '2015-05-19' },
    { nm_jogo: 'God of War Ragnarök',         img_jogo: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png', genero: 'Ação/Aventura', plataforma: 'PS5 / PS4',       classificacao: '18+', descricao: 'Kratos e Atreus enfrentam o apocalipse nórdico. Uma história emocionante sobre pai e filho.', dt_jogo: '2022-11-09' },
    { nm_jogo: 'Hollow Knight',               img_jogo: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/capsule_616x353.jpg', genero: 'Metroidvania',  plataforma: 'PC / Switch',     classificacao: 'Livre', descricao: 'Um Metroidvania desafiador e atmosférico em um reino de insetos subterrâneo. Arte indie de tirar o fôlego.', dt_jogo: '2017-02-24' },
    { nm_jogo: 'Minecraft',                   img_jogo: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/Games_Subnav_Minecraft-300x465.jpg', genero: 'Sandbox',      plataforma: 'Todas',           classificacao: 'Livre', descricao: 'O jogo de sandbox mais vendido da história. Construa, explore e sobreviva em mundos gerados proceduralmente.', dt_jogo: '2011-11-18' },
    { nm_jogo: 'Counter-Strike 2',            img_jogo: 'https://cdn.akamai.steamstatic.com/steam/apps/730/capsule_616x353.jpg', genero: 'FPS Competitivo', plataforma: 'PC',             classificacao: '16+', descricao: 'O jogo de tiro competitivo mais famoso do mundo. Estratégia, precisão e trabalho em equipe em cada round.', dt_jogo: '2023-09-27' },
    { nm_jogo: 'Red Dead Redemption 2',       img_jogo: 'https://image.api.playstation.com/vulcan/img/rnd/202010/0202/rovMno9msMwMT0rnTgkEUhwA.png', genero: 'Mundo Aberto',  plataforma: 'PC / PS4 / Xbox', classificacao: '18+', descricao: 'Uma obra-prima do mundo aberto ambientada no Velho Oeste americano. A história de Arthur Morgan é inesquecível.', dt_jogo: '2018-10-26' },
    { nm_jogo: 'Cyberpunk 2077',              img_jogo: 'https://image.api.playstation.com/vulcan/ap/rnd/202111/3013/cKZ4tKNFj9C00giTzYtH8PF1.png', genero: 'RPG de Ação',    plataforma: 'PC / PS5 / Xbox', classificacao: '18+', descricao: 'Um RPG de ação em primeira pessoa em Night City, uma megalópole futurista obcecada por poder.', dt_jogo: '2020-12-10' },
    { nm_jogo: 'Hades',                       img_jogo: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/capsule_616x353.jpg', genero: 'Ação/Aventura', plataforma: 'PC / Switch / PS5', classificacao: '16+', descricao: 'Um roguelike de ação excepcional onde você escapa do submundo grego. Narrativa integrada ao gameplay.', dt_jogo: '2020-09-17' },
    { nm_jogo: 'Celeste',                     img_jogo: 'https://cdn.akamai.steamstatic.com/steam/apps/504230/capsule_616x353.jpg', genero: 'Plataforma',    plataforma: 'PC / Switch',     classificacao: 'Livre', descricao: 'Um platformer preciso e emocionante sobre escalar uma montanha e superar seus próprios limites.', dt_jogo: '2018-01-25' },
    { nm_jogo: 'The Last of Us Part I',       img_jogo: 'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/JeITAIcvnXmzqxFmJLrDpFI8.png', genero: 'Ação/Aventura', plataforma: 'PC / PS5',        classificacao: '18+', descricao: 'Uma jornada pós-apocalíptica sobre sobrevivência e amor. Considerado um dos maiores jogos já feitos.', dt_jogo: '2022-09-02' },
    { nm_jogo: 'Forza Horizon 5',             img_jogo: 'https://store-images.s-microsoft.com/image/apps.28432.14191572939019178.f2a1c659-4de2-4f0a-b7fe-6e2b4d73c6ad.15c93b67-acab-4e4b-9ed5-7d8cebbba10f', genero: 'Corrida',       plataforma: 'PC / Xbox',       classificacao: 'Livre', descricao: 'O melhor jogo de corrida em mundo aberto. Ambientado no México com centenas de carros.', dt_jogo: '2021-11-09' },
  ];

  const jogos = await Promise.all(
    jogosData.map(j =>
      prisma.tAB_JOGOS.create({
        data: { ...j, id_usuario: admin.id_usuario, dt_jogo: new Date(j.dt_jogo) },
      }),
    ),
  );

  console.log(`✅ ${jogos.length} jogos criados`);

  // ── Avaliações (nota 1-10) ───────────────────────────────
  const avaliacoes = [
    // Elden Ring
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[0].id_jogo, nota: 10, comentario: 'Obra-prima absoluta. FromSoftware superou tudo que fizeram antes. Cada área do mapa é uma surpresa.',  data_jogada: '2022-03-10' },
    { id_usuario: player.id_usuario, id_jogo: jogos[0].id_jogo, nota: 9,  comentario: 'Difícil mas recompensador. A sensação de superar um boss é inigualável.',                              data_jogada: '2022-04-15' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[0].id_jogo, nota: 7,  comentario: 'Muito difícil para mim, mas entendo por que todos adoram. O mundo é lindo.',                           data_jogada: '2022-05-20' },
    // Witcher 3
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[1].id_jogo, nota: 10, comentario: 'O melhor RPG que já joguei. Narrativa, mundo, personagens — tudo perfeito.',                            data_jogada: '2021-06-01' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[1].id_jogo, nota: 9,  comentario: 'Passei 150 horas e quero mais. As expansões são melhores que jogos completos.',                        data_jogada: '2022-01-10' },
    // GoW Ragnarök
    { id_usuario: player.id_usuario, id_jogo: jogos[2].id_jogo, nota: 10, comentario: 'Conseguiram superar o anterior. Emocionei muito no final.',                                             data_jogada: '2022-12-05' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[2].id_jogo, nota: 9,  comentario: 'Narrativa incrível. O combate evoluiu muito.',                                                         data_jogada: '2023-01-20' },
    // Hollow Knight
    { id_usuario: player.id_usuario, id_jogo: jogos[3].id_jogo, nota: 10, comentario: 'Melhor indie de todos os tempos. Arte, música, desafio — perfeito.',                                   data_jogada: '2021-08-15' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[3].id_jogo, nota: 9,  comentario: 'Brutalmente difícil no final, mas tão gratificante.',                                                  data_jogada: '2021-09-01' },
    // RDR2
    { id_usuario: casual.id_usuario, id_jogo: jogos[6].id_jogo, nota: 10, comentario: 'A história de Arthur Morgan me fez chorar. Imersão absurda.',                                          data_jogada: '2021-12-25' },
    { id_usuario: player.id_usuario, id_jogo: jogos[6].id_jogo, nota: 8,  comentario: 'O mundo é incrível mas o gameplay pode ser lento às vezes.',                                           data_jogada: '2022-02-14' },
    // CS2
    { id_usuario: player.id_usuario, id_jogo: jogos[5].id_jogo, nota: 8,  comentario: 'Melhorou muito do CSGO. Visual renovado e hitbox consertada.',                                         data_jogada: '2023-10-05' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[5].id_jogo, nota: 7,  comentario: 'Ainda adictivo. Mas o suporte da Valve deixa a desejar.',                                              data_jogada: '2023-11-01' },
    // Hades
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[8].id_jogo, nota: 10, comentario: 'O roguelike perfeito. Nunca enjoa, sempre tem algo novo para descobrir.',                              data_jogada: '2022-07-10' },
    // Celeste
    { id_usuario: casual.id_usuario, id_jogo: jogos[9].id_jogo, nota: 9,  comentario: 'Me surpreendeu muito. A metáfora com saúde mental é muito bem feita.',                                data_jogada: '2023-03-15' },
    // The Last of Us
    { id_usuario: casual.id_usuario, id_jogo: jogos[10].id_jogo, nota: 10, comentario: 'Chorei feio no final. Uma experiência que vai além de um jogo.',                                     data_jogada: '2023-05-20' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[10].id_jogo, nota: 9,  comentario: 'Storytelling cinematográfico no seu melhor. Joel e Ellie são inesquecíveis.',                        data_jogada: '2023-06-01' },
  ];

  await Promise.all(
    avaliacoes.map(a =>
      prisma.tAB_AVALIACAO.create({
        data: {
          ...a,
          data_jogada: a.data_jogada ? new Date(a.data_jogada) : null,
        },
      }),
    ),
  );

  console.log(`✅ ${avaliacoes.length} avaliações criadas`);

  // ── Likes em avaliações ──────────────────────────────────
  const todasAv = await prisma.tAB_AVALIACAO.findMany();
  const likesData = [
    { id_usuario: player.id_usuario,  id_avaliacao: todasAv[0].id_avaliacao }, // player curte review do gamer
    { id_usuario: casual.id_usuario,  id_avaliacao: todasAv[0].id_avaliacao },
    { id_usuario: gamer.id_usuario,   id_avaliacao: todasAv[2].id_avaliacao }, // gamer curte review do player
    { id_usuario: casual.id_usuario,  id_avaliacao: todasAv[5].id_avaliacao },
    { id_usuario: gamer.id_usuario,   id_avaliacao: todasAv[9].id_avaliacao },
    { id_usuario: player.id_usuario,  id_avaliacao: todasAv[13].id_avaliacao },
  ].filter(l => {
    const av = todasAv.find(a => a.id_avaliacao === l.id_avaliacao);
    return av && av.id_usuario !== l.id_usuario; // não pode curtir a própria
  });

  await Promise.all(
    likesData.map(l =>
      prisma.tAB_LIKE_REVIEW.upsert({
        where: { id_usuario_id_avaliacao: { id_usuario: l.id_usuario, id_avaliacao: l.id_avaliacao } },
        update: {},
        create: l,
      }),
    ),
  );

  console.log(`✅ Likes criados`);

  // ── Listas ───────────────────────────────────────────────
  const lista1 = await prisma.tAB_LISTA.create({
    data: {
      id_usuario: gamer.id_usuario,
      nm_lista:   'RPGs Essenciais',
      descricao:  'Os melhores RPGs que todo gamer deve jogar pelo menos uma vez na vida.',
      publica:    true,
    },
  });

  const lista2 = await prisma.tAB_LISTA.create({
    data: {
      id_usuario: casual.id_usuario,
      nm_lista:   'Para jogar no fim de semana',
      descricao:  'Jogos perfeitos para sessões curtas e relaxadas.',
      publica:    true,
    },
  });

  const lista3 = await prisma.tAB_LISTA.create({
    data: {
      id_usuario: player.id_usuario,
      nm_lista:   'Jogos Indie Incríveis',
      descricao:  'A nata dos jogos independentes que provam que AAA não é tudo.',
      publica:    true,
    },
  });

  await Promise.all([
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[0].id_jogo } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[1].id_jogo } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[8].id_jogo } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista2.id_lista, id_jogo: jogos[4].id_jogo } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista2.id_lista, id_jogo: jogos[9].id_jogo } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista2.id_lista, id_jogo: jogos[11].id_jogo } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[3].id_jogo } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[8].id_jogo } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[9].id_jogo } }),
  ]);

  console.log('✅ Listas criadas');

  // ── Status e Vitrine ─────────────────────────────────────
  const statusData = [
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[0].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 1 },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[1].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 2 },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[3].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 3 },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[8].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 4 },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[5].id_jogo,  status: 'JOGANDO',     favorito: false, top_position: null },
    { id_usuario: player.id_usuario, id_jogo: jogos[2].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 1 },
    { id_usuario: player.id_usuario, id_jogo: jogos[5].id_jogo,  status: 'JOGANDO',     favorito: true,  top_position: 2 },
    { id_usuario: player.id_usuario, id_jogo: jogos[3].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 3 },
    { id_usuario: casual.id_usuario, id_jogo: jogos[6].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 1 },
    { id_usuario: casual.id_usuario, id_jogo: jogos[10].id_jogo, status: 'ZERADO',      favorito: true,  top_position: 2 },
    { id_usuario: casual.id_usuario, id_jogo: jogos[4].id_jogo,  status: 'QUERO_JOGAR', favorito: false, top_position: null },
  ];

  await Promise.all(
    statusData.map(s => prisma.tAB_STATUS_JOGO.create({ data: s })),
  );

  console.log('✅ Status e Vitrine configurados');
  console.log('\n🎮 Seed concluído! Contas de teste:');
  console.log('   admin       / admin123');
  console.log('   gamer_br    / senha123');
  console.log('   player_one  / senha123');
  console.log('   casual_gamer / senha123\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

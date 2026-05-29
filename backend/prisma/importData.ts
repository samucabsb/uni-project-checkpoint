/**
 * Seed v1.7 — jogadores + reações (LIKE/DISLIKE)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IMG = {
  elden_ring:    'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg',
  witcher3:      'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg',
  gow_ragnarok:  'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/library_600x900.jpg',
  hollow_knight: 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/library_600x900.jpg',
  minecraft:     'https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/library_600x900.jpg',
  cs2:           'https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900.jpg',
  rdr2:          'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg',
  hades:         'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/library_600x900.jpg',
  celeste:       'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg',
  tlou:          'https://cdn.cloudflare.steamstatic.com/steam/apps/1888930/library_600x900.jpg',
  cyberpunk:     'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg',
  forza:         'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/library_600x900.jpg',
};

async function main() {
  console.log('\n🌱 Checkpoint v1.7 — seed\n');

  await prisma.tAB_ATIVIDADE.deleteMany();
  await prisma.tAB_DIARIO_JOGO.deleteMany();
  await prisma.tAB_COMENTARIO_REVIEW.deleteMany();
  await prisma.tAB_LIKE_LISTA.deleteMany();
  await prisma.tAB_REACAO_REVIEW.deleteMany();
  await prisma.tAB_STATUS_JOGO.deleteMany();
  await prisma.tAB_LISTA_JOGO.deleteMany();
  await prisma.tAB_LISTA.deleteMany();
  await prisma.tAB_AVALIACAO.deleteMany();
  await prisma.tAB_FOLLOW.deleteMany();
  await prisma.tAB_JOGOS.deleteMany();
  await prisma.tAB_USUARIO.deleteMany();
  console.log('✅ Banco limpo');

  const senhaHash = await bcrypt.hash('senha123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  const [admin, gamer, player, casual] = await Promise.all([
    prisma.tAB_USUARIO.create({ data: { nm_usuario: 'admin',        email_usuario: 'admin@checkpoint.com',  senha_usuario: adminHash, tipo_usuario: 'ADMIN', bio_usuario: 'Administrador do Checkpoint.',                          img_usuario: 'https://api.dicebear.com/8.x/adventurer/svg?seed=admin'    } }),
    prisma.tAB_USUARIO.create({ data: { nm_usuario: 'gamer_br',     email_usuario: 'gamer@checkpoint.com',  senha_usuario: senhaHash,                        bio_usuario: 'Jogador hardcore. Zerador compulsivo. RPG é vida.',       img_usuario: 'https://api.dicebear.com/8.x/adventurer/svg?seed=knight'   } }),
    prisma.tAB_USUARIO.create({ data: { nm_usuario: 'player_one',   email_usuario: 'player@checkpoint.com', senha_usuario: senhaHash,                        bio_usuario: 'FPS competitivo e jogos indie. Sempre buscando desafios.',img_usuario: 'https://api.dicebear.com/8.x/adventurer/svg?seed=ninja'    } }),
    prisma.tAB_USUARIO.create({ data: { nm_usuario: 'casual_gamer', email_usuario: 'casual@checkpoint.com', senha_usuario: senhaHash,                        bio_usuario: 'Jogo nos fins de semana. Amo histórias e mundo aberto.',  img_usuario: 'https://api.dicebear.com/8.x/adventurer/svg?seed=explorer' } }),
  ]);
  console.log('✅ Usuários');

  await Promise.all([
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: gamer.id_usuario,  id_usuario_seguido: player.id_usuario  } }),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: gamer.id_usuario,  id_usuario_seguido: casual.id_usuario  } }),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: player.id_usuario, id_usuario_seguido: gamer.id_usuario   } }),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: casual.id_usuario, id_usuario_seguido: gamer.id_usuario   } }),
  ]);

  const jogosData = [
    { nm_jogo: 'Elden Ring',            img_jogo: IMG.elden_ring,    genero: 'RPG de Ação',   plataforma: 'PC / PS5 / Xbox', classificacao: '16+', jogadores: 'Solo / Co-op online',     descricao: 'RPG de ação em mundo aberto criado com George R. R. Martin. Cada área reserva uma surpresa.',               dt_jogo: '2022-02-25' },
    { nm_jogo: 'The Witcher 3',          img_jogo: IMG.witcher3,      genero: 'RPG de Ação',   plataforma: 'PC / PS5 / Xbox', classificacao: '18+', jogadores: 'Solo',                     descricao: 'Um dos maiores RPGs da história. Geralt busca sua filha adotiva em um mundo devastado pela guerra.',          dt_jogo: '2015-05-19' },
    { nm_jogo: 'God of War Ragnarök',    img_jogo: IMG.gow_ragnarok,  genero: 'Ação/Aventura', plataforma: 'PS5 / PS4',       classificacao: '18+', jogadores: 'Solo',                     descricao: 'Kratos e Atreus enfrentam o apocalipse nórdico nesta sequência cinematográfica e emocionante.',               dt_jogo: '2022-11-09' },
    { nm_jogo: 'Hollow Knight',          img_jogo: IMG.hollow_knight, genero: 'Metroidvania',  plataforma: 'PC / Switch',     classificacao: 'Livre', jogadores: 'Solo',                   descricao: 'Metroidvania desafiador e belíssimo ambientado em um reino de insetos subterrâneo.',                          dt_jogo: '2017-02-24' },
    { nm_jogo: 'Minecraft',              img_jogo: IMG.minecraft,     genero: 'Sandbox',       plataforma: 'Todas',           classificacao: 'Livre', jogadores: 'Solo / Multiplayer',     descricao: 'O jogo sandbox mais vendido da história. Construa, explore e sobreviva em mundos infinitos.',                dt_jogo: '2011-11-18' },
    { nm_jogo: 'Counter-Strike 2',       img_jogo: IMG.cs2,           genero: 'FPS',           plataforma: 'PC',              classificacao: '16+', jogadores: 'Multiplayer competitivo',  descricao: 'O FPS competitivo mais popular do mundo. Estratégia, precisão e trabalho em equipe.',                         dt_jogo: '2023-09-27' },
    { nm_jogo: 'Red Dead Redemption 2',  img_jogo: IMG.rdr2,          genero: 'Mundo Aberto',  plataforma: 'PC / PS4 / Xbox', classificacao: '18+', jogadores: 'Solo / Multiplayer online', descricao: 'Obra-prima no Velho Oeste. A história de Arthur Morgan é uma das mais impactantes dos videogames.',            dt_jogo: '2018-10-26' },
    { nm_jogo: 'Hades',                  img_jogo: IMG.hades,         genero: 'Roguelike',     plataforma: 'PC / Switch / PS5', classificacao: '16+', jogadores: 'Solo',                   descricao: 'Roguelike de ação onde cada tentativa de fuga do submundo grego avança a narrativa.',                         dt_jogo: '2020-09-17' },
    { nm_jogo: 'Celeste',                img_jogo: IMG.celeste,       genero: 'Plataforma',    plataforma: 'PC / Switch',     classificacao: 'Livre', jogadores: 'Solo',                   descricao: 'Platformer preciso e emotivo sobre escalar uma montanha e superar seus próprios limites.',                     dt_jogo: '2018-01-25' },
    { nm_jogo: 'The Last of Us Part I',  img_jogo: IMG.tlou,          genero: 'Ação/Aventura', plataforma: 'PC / PS5',        classificacao: '18+', jogadores: 'Solo',                     descricao: 'Jornada pós-apocalíptica sobre sobrevivência e amor. Considerado um dos melhores jogos já criados.',          dt_jogo: '2022-09-02' },
    { nm_jogo: 'Cyberpunk 2077',         img_jogo: IMG.cyberpunk,     genero: 'RPG de Ação',   plataforma: 'PC / PS5 / Xbox', classificacao: '18+', jogadores: 'Solo',                     descricao: 'RPG em Night City, uma megalópole futurista obcecada por poder e tecnologia.',                                dt_jogo: '2020-12-10' },
    { nm_jogo: 'Forza Horizon 5',        img_jogo: IMG.forza,         genero: 'Corrida',       plataforma: 'PC / Xbox',       classificacao: 'Livre', jogadores: 'Solo / Multiplayer online', descricao: 'O melhor jogo de corrida em mundo aberto. Ambientado no México com centenas de carros.', dt_jogo: '2021-11-09' },
  ];

  const jogos = await Promise.all(
    jogosData.map(j => prisma.tAB_JOGOS.create({ data: { ...j, id_usuario: admin.id_usuario, dt_jogo: new Date(j.dt_jogo) } })),
  );
  console.log(`✅ ${jogos.length} jogos com campo jogadores`);

  const avDados = [
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[0].id_jogo,  nota: 10, comentario: 'Obra-prima absoluta. Cada área é uma surpresa.',                         data_jogada: '2022-03-10' },
    { id_usuario: player.id_usuario, id_jogo: jogos[0].id_jogo,  nota: 9,  comentario: 'Difícil mas recompensador. A sensação de superar um boss é inigualável.',  data_jogada: '2022-04-15' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[0].id_jogo,  nota: 7,  comentario: 'Muito difícil, mas entendo por que todos adoram.',                         data_jogada: '2022-05-20' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[1].id_jogo,  nota: 10, comentario: 'O melhor RPG que já joguei. Narrativa, mundo e personagens perfeitos.',    data_jogada: '2021-06-01' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[1].id_jogo,  nota: 9,  comentario: 'Passei 150h e quero mais. As expansões são incríveis.',                    data_jogada: '2022-01-10' },
    { id_usuario: player.id_usuario, id_jogo: jogos[2].id_jogo,  nota: 10, comentario: 'Superaram o anterior. Me emocionei muito no final.',                       data_jogada: '2022-12-05' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[2].id_jogo,  nota: 9,  comentario: 'Storytelling no seu melhor. Combate muito melhorado.',                     data_jogada: '2023-01-20' },
    { id_usuario: player.id_usuario, id_jogo: jogos[3].id_jogo,  nota: 10, comentario: 'Melhor indie de todos os tempos. Perfeito em todos os aspectos.',          data_jogada: '2021-08-15' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[3].id_jogo,  nota: 9,  comentario: 'Brutalmente difícil no final, mas a satisfação é imensa.',                 data_jogada: '2021-09-01' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[6].id_jogo,  nota: 10, comentario: 'A história de Arthur Morgan me fez chorar. Imersão em outro nível.',       data_jogada: '2021-12-25' },
    { id_usuario: player.id_usuario, id_jogo: jogos[6].id_jogo,  nota: 8,  comentario: 'Mundo incrível. Vale cada segundo.',                                       data_jogada: '2022-02-14' },
    { id_usuario: player.id_usuario, id_jogo: jogos[5].id_jogo,  nota: 8,  comentario: 'Melhorou muito do CSGO. Melhor FPS competitivo.',                          data_jogada: '2023-10-05' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[7].id_jogo,  nota: 10, comentario: 'O roguelike perfeito. Nunca enjoa.',                                       data_jogada: '2022-07-10' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[8].id_jogo,  nota: 9,  comentario: 'Me surpreendeu. A metáfora com saúde mental é muito bem construída.',      data_jogada: '2023-03-15' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[9].id_jogo,  nota: 10, comentario: 'Chorei no final. Uma experiência que transcende os videogames.',           data_jogada: '2023-05-20' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[9].id_jogo,  nota: 9,  comentario: 'Joel e Ellie são dos personagens mais bem escritos da história dos jogos.',data_jogada: '2023-06-01' },
  ];

  const avaliacoes = await Promise.all(
    avDados.map(a => prisma.tAB_AVALIACAO.create({
      data: { ...a, data_jogada: a.data_jogada ? new Date(a.data_jogada) : null },
    })),
  );
  console.log(`✅ ${avaliacoes.length} avaliações`);

  // Reações (LIKE/DISLIKE)
  const reacoesData = [
    { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao,  tipo: 'LIKE'    },
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao,  tipo: 'LIKE'    },
    { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[2].id_avaliacao,  tipo: 'DISLIKE' },
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[5].id_avaliacao,  tipo: 'LIKE'    },
    { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[9].id_avaliacao,  tipo: 'LIKE'    },
    { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[12].id_avaliacao, tipo: 'LIKE'    },
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[3].id_avaliacao,  tipo: 'LIKE'    },
    { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[14].id_avaliacao, tipo: 'LIKE'    },
    { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[4].id_avaliacao,  tipo: 'DISLIKE' },
  ].filter(r => {
    const av = avaliacoes.find(a => a.id_avaliacao === r.id_avaliacao);
    return av && av.id_usuario !== r.id_usuario;
  });

  await Promise.all(reacoesData.map(r => prisma.tAB_REACAO_REVIEW.create({ data: r })));
  console.log(`✅ ${reacoesData.length} reações`);

  await Promise.all([
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao,  texto: 'Concordo! A área de Farum Azula é incrível.' } }),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao,  texto: 'Precisei de guia mas foi a melhor experiência.' } }),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[5].id_avaliacao,  texto: 'O final é o melhor fechamento que já vi.' } }),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[12].id_avaliacao, texto: 'O dash nunca enjoa. Satisfação absurda.' } }),
  ]);

  const [lista1, lista2, lista3] = await Promise.all([
    prisma.tAB_LISTA.create({ data: { id_usuario: gamer.id_usuario,  nm_lista: 'RPGs Essenciais',             descricao: 'Os melhores RPGs que todo gamer deve jogar.',    publica: true } }),
    prisma.tAB_LISTA.create({ data: { id_usuario: casual.id_usuario, nm_lista: 'Para jogar no fim de semana', descricao: 'Perfeitos para sessões curtas e relaxadas.',      publica: true } }),
    prisma.tAB_LISTA.create({ data: { id_usuario: player.id_usuario, nm_lista: 'Indies Incríveis',            descricao: 'A nata dos jogos independentes.',                publica: true } }),
  ]);

  await Promise.all([
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[0].id_jogo, position: 1 } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[1].id_jogo, position: 2 } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[7].id_jogo, position: 3 } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista2.id_lista, id_jogo: jogos[4].id_jogo, position: 1 } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista2.id_lista, id_jogo: jogos[8].id_jogo, position: 2 } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista2.id_lista, id_jogo: jogos[11].id_jogo, position: 3 } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[3].id_jogo, position: 1 } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[7].id_jogo, position: 2 } }),
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[8].id_jogo, position: 3 } }),
  ]);

  await Promise.all([
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: player.id_usuario,  id_lista: lista1.id_lista } }),
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: casual.id_usuario,  id_lista: lista1.id_lista } }),
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: gamer.id_usuario,   id_lista: lista2.id_lista } }),
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: player.id_usuario,  id_lista: lista3.id_lista } }),
  ]);

  await Promise.all([
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[0].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 1 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[1].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 2 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[3].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 3 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[7].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 4 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[5].id_jogo,  status: 'JOGANDO',     favorito: false                   } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[2].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 1 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[5].id_jogo,  status: 'JOGANDO',     favorito: true,  top_position: 2 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[3].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 3 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[6].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 1 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[9].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 2 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[4].id_jogo,  status: 'ABANDONADO',  favorito: false                   } }),
  ]);

  await Promise.all([
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[5].id_jogo, data_jogada: new Date('2024-01-10'), nota: 8, comentario: 'Sessão ranqueada. Ganhei 3 de 5.' } }),
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[5].id_jogo, data_jogada: new Date('2024-01-15'), nota: 9, comentario: 'Melhor dia de CS da semana.' } }),
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[4].id_jogo, data_jogada: new Date('2024-02-01'), comentario: 'Construindo uma nova cidade.' } }),
  ]);

  const atividades = [
    { id_usuario: gamer.id_usuario,  tipo: 'AVALIOU_JOGO',         id_jogo: jogos[0].id_jogo, id_avaliacao: avaliacoes[0].id_avaliacao },
    { id_usuario: player.id_usuario, tipo: 'AVALIOU_JOGO',         id_jogo: jogos[2].id_jogo, id_avaliacao: avaliacoes[5].id_avaliacao },
    { id_usuario: casual.id_usuario, tipo: 'AVALIOU_JOGO',         id_jogo: jogos[6].id_jogo, id_avaliacao: avaliacoes[9].id_avaliacao },
    { id_usuario: gamer.id_usuario,  tipo: 'CRIOU_LISTA',          id_lista: lista1.id_lista  },
    { id_usuario: casual.id_usuario, tipo: 'CRIOU_LISTA',          id_lista: lista2.id_lista  },
    { id_usuario: player.id_usuario, tipo: 'CRIOU_LISTA',          id_lista: lista3.id_lista  },
    { id_usuario: gamer.id_usuario,  tipo: 'FAVORITOU_JOGO',       id_jogo: jogos[0].id_jogo  },
    { id_usuario: player.id_usuario, tipo: 'FAVORITOU_JOGO',       id_jogo: jogos[2].id_jogo  },
    { id_usuario: casual.id_usuario, tipo: 'FAVORITOU_JOGO',       id_jogo: jogos[6].id_jogo  },
    { id_usuario: gamer.id_usuario,  tipo: 'SEGUIU_USUARIO',       id_usuario_alvo: player.id_usuario },
    { id_usuario: player.id_usuario, tipo: 'SEGUIU_USUARIO',       id_usuario_alvo: gamer.id_usuario  },
    { id_usuario: gamer.id_usuario,  tipo: 'MUDOU_STATUS',         id_jogo: jogos[5].id_jogo, dados_extras: 'JOGANDO' },
    { id_usuario: player.id_usuario, tipo: 'CURTIU_REVIEW',        id_avaliacao: avaliacoes[0].id_avaliacao },
    { id_usuario: gamer.id_usuario,  tipo: 'ADICIONOU_JOGO_LISTA', id_lista: lista1.id_lista, id_jogo: jogos[0].id_jogo },
    { id_usuario: casual.id_usuario, tipo: 'CURTIU_LISTA',         id_lista: lista1.id_lista  },
  ];
  await Promise.all(atividades.map(a => prisma.tAB_ATIVIDADE.create({ data: a })));

  console.log('\n🎮 Seed v1.7 concluído!\n');
  console.log('   admin        / admin123');
  console.log('   gamer_br     / senha123');
  console.log('   player_one   / senha123');
  console.log('   casual_gamer / senha123\n');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

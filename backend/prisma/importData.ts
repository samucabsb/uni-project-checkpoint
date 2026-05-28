/**
 * Seed v1.6 — imagens via Steam CDN (portrait, confiável, sem CORS)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Steam CDN: library_600x900 = imagem de biblioteca vertical (retrato)
// Funciona sem autenticação e sem CORS para hotlink
const IMG = {
  elden_ring:    'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg',
  witcher3:      'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg',
  gow_ragnarok:  'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/library_600x900.jpg',
  hollow_knight: 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/library_600x900.jpg',
  minecraft:     'https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/library_600x900.jpg', // Minecraft Legends como placeholder
  cs2:           'https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900.jpg',
  rdr2:          'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg',
  hades:         'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/library_600x900.jpg',
  celeste:       'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg',
  tlou:          'https://cdn.cloudflare.steamstatic.com/steam/apps/1888930/library_600x900.jpg',
  cyberpunk:     'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg',
  forza:         'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/library_600x900.jpg', // Forza Horizon 5
};

async function main() {
  console.log('\n🌱 Checkpoint v1.6 — seed iniciado\n');

  await prisma.tAB_ATIVIDADE.deleteMany();
  await prisma.tAB_DIARIO_JOGO.deleteMany();
  await prisma.tAB_COMENTARIO_REVIEW.deleteMany();
  await prisma.tAB_LIKE_LISTA.deleteMany();
  await prisma.tAB_LIKE_REVIEW.deleteMany();
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
    prisma.tAB_USUARIO.create({ data: { nm_usuario: 'admin',        email_usuario: 'admin@checkpoint.com',  senha_usuario: adminHash, tipo_usuario: 'ADMIN', bio_usuario: 'Administrador do Checkpoint.', img_usuario: 'https://api.dicebear.com/8.x/adventurer/svg?seed=admin'    } }),
    prisma.tAB_USUARIO.create({ data: { nm_usuario: 'gamer_br',     email_usuario: 'gamer@checkpoint.com',  senha_usuario: senhaHash,                        bio_usuario: 'Jogador hardcore. Zerador compulsivo. RPG é vida.', img_usuario: 'https://api.dicebear.com/8.x/adventurer/svg?seed=knight'   } }),
    prisma.tAB_USUARIO.create({ data: { nm_usuario: 'player_one',   email_usuario: 'player@checkpoint.com', senha_usuario: senhaHash,                        bio_usuario: 'FPS competitivo e jogos indie. Sempre buscando desafios.', img_usuario: 'https://api.dicebear.com/8.x/adventurer/svg?seed=ninja'    } }),
    prisma.tAB_USUARIO.create({ data: { nm_usuario: 'casual_gamer', email_usuario: 'casual@checkpoint.com', senha_usuario: senhaHash,                        bio_usuario: 'Jogo nos fins de semana. Gosto de história e mundo aberto.', img_usuario: 'https://api.dicebear.com/8.x/adventurer/svg?seed=explorer' } }),
  ]);
  console.log('✅ Usuários');

  await Promise.all([
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: gamer.id_usuario,  id_usuario_seguido: player.id_usuario  } }),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: gamer.id_usuario,  id_usuario_seguido: casual.id_usuario  } }),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: player.id_usuario, id_usuario_seguido: gamer.id_usuario   } }),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: casual.id_usuario, id_usuario_seguido: gamer.id_usuario   } }),
  ]);

  const jogosData = [
    { nm_jogo: 'Elden Ring',            img_jogo: IMG.elden_ring,    genero: 'RPG de Ação',    plataforma: 'PC / PS5 / Xbox', classificacao: '16+', descricao: 'Um RPG de ação épico em vasto mundo aberto, criado em parceria com George R. R. Martin.',                              dt_jogo: '2022-02-25' },
    { nm_jogo: 'The Witcher 3',          img_jogo: IMG.witcher3,      genero: 'RPG de Ação',    plataforma: 'PC / PS5 / Xbox', classificacao: '18+', descricao: 'Um dos maiores RPGs de todos os tempos. Geralt de Rívia busca sua filha adotiva em um mundo devastado pela guerra.', dt_jogo: '2015-05-19' },
    { nm_jogo: 'God of War Ragnarök',    img_jogo: IMG.gow_ragnarok,  genero: 'Ação/Aventura',  plataforma: 'PS5 / PS4',       classificacao: '18+', descricao: 'Kratos e Atreus enfrentam o apocalipse nórdico nesta sequência cinematográfica e emocional.',                      dt_jogo: '2022-11-09' },
    { nm_jogo: 'Hollow Knight',          img_jogo: IMG.hollow_knight, genero: 'Metroidvania',   plataforma: 'PC / Switch',     classificacao: 'Livre', descricao: 'Metroidvania desafiador e belíssimo ambientado em um reino de insetos subterrâneo. Arte indie excepcional.',     dt_jogo: '2017-02-24' },
    { nm_jogo: 'Minecraft',              img_jogo: IMG.minecraft,     genero: 'Sandbox',        plataforma: 'Todas',           classificacao: 'Livre', descricao: 'O jogo sandbox mais vendido da história. Construa, explore e sobreviva em mundos infinitos gerados proceduralmente.', dt_jogo: '2011-11-18' },
    { nm_jogo: 'Counter-Strike 2',       img_jogo: IMG.cs2,           genero: 'FPS',            plataforma: 'PC',              classificacao: '16+', descricao: 'O jogo de tiro competitivo mais jogado do mundo. Estratégia, precisão e trabalho em equipe são essenciais.',           dt_jogo: '2023-09-27' },
    { nm_jogo: 'Red Dead Redemption 2',  img_jogo: IMG.rdr2,          genero: 'Mundo Aberto',   plataforma: 'PC / PS4 / Xbox', classificacao: '18+', descricao: 'Uma obra-prima ambientada no Velho Oeste. A história de Arthur Morgan é uma das mais impactantes dos videogames.', dt_jogo: '2018-10-26' },
    { nm_jogo: 'Hades',                  img_jogo: IMG.hades,         genero: 'Roguelike',      plataforma: 'PC / Switch / PS5', classificacao: '16+', descricao: 'Roguelike de ação excepcional. Narrativa integrada ao gameplay onde cada tentativa de fuga do submundo grego avança a história.', dt_jogo: '2020-09-17' },
    { nm_jogo: 'Celeste',                img_jogo: IMG.celeste,       genero: 'Plataforma',     plataforma: 'PC / Switch',     classificacao: 'Livre', descricao: 'Platformer preciso e emotivo sobre escalar uma montanha e superar seus próprios limites internos.',             dt_jogo: '2018-01-25' },
    { nm_jogo: 'The Last of Us Part I',  img_jogo: IMG.tlou,          genero: 'Ação/Aventura',  plataforma: 'PC / PS5',        classificacao: '18+', descricao: 'Uma jornada pós-apocalíptica sobre sobrevivência, amor e sacrifício. Considerado um dos maiores jogos já criados.', dt_jogo: '2022-09-02' },
    { nm_jogo: 'Cyberpunk 2077',         img_jogo: IMG.cyberpunk,     genero: 'RPG de Ação',    plataforma: 'PC / PS5 / Xbox', classificacao: '18+', descricao: 'RPG de ação ambientado em Night City, uma megalópole futurista obcecada por poder, glamour e tecnologia.',         dt_jogo: '2020-12-10' },
    { nm_jogo: 'Forza Horizon 5',        img_jogo: IMG.forza,         genero: 'Corrida',        plataforma: 'PC / Xbox',       classificacao: 'Livre', descricao: 'O melhor jogo de corrida em mundo aberto. Ambientado no México com centenas de carros e eventos sazonais.',        dt_jogo: '2021-11-09' },
  ];

  const jogos = await Promise.all(
    jogosData.map(j => prisma.tAB_JOGOS.create({ data: { ...j, id_usuario: admin.id_usuario, dt_jogo: new Date(j.dt_jogo) } })),
  );
  console.log(`✅ ${jogos.length} jogos`);

  const avDados = [
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[0].id_jogo,  nota: 10, comentario: 'Obra-prima absoluta. Mundo aberto mais impressionante já criado. Cada área é uma surpresa única.',     data_jogada: '2022-03-10' },
    { id_usuario: player.id_usuario, id_jogo: jogos[0].id_jogo,  nota: 9,  comentario: 'Difícil mas extremamente recompensador. A sensação de superar um boss é inigualável.',                  data_jogada: '2022-04-15' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[0].id_jogo,  nota: 7,  comentario: 'Muito difícil para mim, mas entendo por que todos adoram. O mundo é simplesmente lindo.',               data_jogada: '2022-05-20' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[1].id_jogo,  nota: 10, comentario: 'O melhor RPG que já joguei. Narrativa, mundo, personagens — absolutamente tudo é perfeito.',             data_jogada: '2021-06-01' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[1].id_jogo,  nota: 9,  comentario: 'Passei 150 horas e ainda quero mais. As expansões são melhores que jogos AAA completos.',               data_jogada: '2022-01-10' },
    { id_usuario: player.id_usuario, id_jogo: jogos[2].id_jogo,  nota: 10, comentario: 'Conseguiram superar o anterior de todas as formas. Me emocionei no final. Narrativa impecável.',        data_jogada: '2022-12-05' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[2].id_jogo,  nota: 9,  comentario: 'Storytelling cinematográfico no seu melhor. O combate evoluiu muito. Jogo obrigatório.',                data_jogada: '2023-01-20' },
    { id_usuario: player.id_usuario, id_jogo: jogos[3].id_jogo,  nota: 10, comentario: 'Melhor indie de todos os tempos. Arte, trilha sonora, desafio — simplesmente perfeito.',                data_jogada: '2021-08-15' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[3].id_jogo,  nota: 9,  comentario: 'Brutalmente difícil na reta final, mas a satisfação de completar é imensa.',                            data_jogada: '2021-09-01' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[6].id_jogo,  nota: 10, comentario: 'A história de Arthur Morgan me fez chorar de verdade. Imersão e emoção em outro nível.',               data_jogada: '2021-12-25' },
    { id_usuario: player.id_usuario, id_jogo: jogos[6].id_jogo,  nota: 8,  comentario: 'Mundo incrível mas o gameplay pode ser lento às vezes. Vale cada segundo mesmo assim.',                data_jogada: '2022-02-14' },
    { id_usuario: player.id_usuario, id_jogo: jogos[5].id_jogo,  nota: 8,  comentario: 'Melhorou muito do CSGO. Visual renovado, hitbox consertada. Melhor FPS competitivo disponível.',       data_jogada: '2023-10-05' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[7].id_jogo,  nota: 10, comentario: 'O roguelike mais bem executado que existe. Nunca enjoa, sempre há algo novo para descobrir.',           data_jogada: '2022-07-10' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[8].id_jogo,  nota: 9,  comentario: 'Me surpreendeu demais. A metáfora com saúde mental é construída de forma muito sensível.',             data_jogada: '2023-03-15' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[9].id_jogo,  nota: 10, comentario: 'Chorei no final. Uma experiência que transcende o que esperamos de um videogame.',                     data_jogada: '2023-05-20' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[9].id_jogo,  nota: 9,  comentario: 'Joel e Ellie são dois dos personagens mais bem escritos da história dos jogos.',                        data_jogada: '2023-06-01' },
  ];

  const avaliacoes = await Promise.all(
    avDados.map(a => prisma.tAB_AVALIACAO.create({
      data: { ...a, data_jogada: a.data_jogada ? new Date(a.data_jogada) : null },
    })),
  );
  console.log(`✅ ${avaliacoes.length} avaliações`);

  const likesReview = [
    { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao },
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao },
    { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[2].id_avaliacao },
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[5].id_avaliacao },
    { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[9].id_avaliacao },
    { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[12].id_avaliacao },
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[3].id_avaliacao },
  ].filter(l => {
    const av = avaliacoes.find(a => a.id_avaliacao === l.id_avaliacao);
    return av && av.id_usuario !== l.id_usuario;
  });
  await Promise.all(likesReview.map(l => prisma.tAB_LIKE_REVIEW.create({ data: l })));

  await Promise.all([
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao, texto: 'Concordo! A área de Farum Azula é de tirar o fôlego.' } }),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao, texto: 'Precisei de guia mas foi uma das melhores experiências que já tive.' } }),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[5].id_avaliacao, texto: 'O final é de longe o melhor fechamento que já vi em um jogo.' } }),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[12].id_avaliacao, texto: 'A mecânica de dash é tão satisfatória que não enjoa nunca.' } }),
  ]);

  const [lista1, lista2, lista3] = await Promise.all([
    prisma.tAB_LISTA.create({ data: { id_usuario: gamer.id_usuario,  nm_lista: 'RPGs Essenciais',             descricao: 'Os melhores RPGs que todo gamer deve jogar pelo menos uma vez na vida.', publica: true } }),
    prisma.tAB_LISTA.create({ data: { id_usuario: casual.id_usuario, nm_lista: 'Para jogar no fim de semana', descricao: 'Jogos perfeitos para sessões curtas e relaxadas nos fins de semana.',    publica: true } }),
    prisma.tAB_LISTA.create({ data: { id_usuario: player.id_usuario, nm_lista: 'Indies Incríveis',            descricao: 'A nata dos jogos independentes — provam que AAA não é tudo.',             publica: true } }),
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
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[5].id_jogo,  status: 'JOGANDO',     favorito: false, top_position: null } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[2].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 1 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[5].id_jogo,  status: 'JOGANDO',     favorito: true,  top_position: 2 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[3].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 3 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[6].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 1 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[9].id_jogo,  status: 'ZERADO',      favorito: true,  top_position: 2 } }),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[4].id_jogo,  status: 'QUERO_JOGAR', favorito: false, top_position: null } }),
  ]);

  await Promise.all([
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: gamer.id_usuario,   id_jogo: jogos[5].id_jogo, data_jogada: new Date('2024-01-10'), nota: 8, comentario: 'Sessão ranqueada. Ganhei 3 de 5 partidas.' } }),
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: gamer.id_usuario,   id_jogo: jogos[5].id_jogo, data_jogada: new Date('2024-01-15'), nota: 9, comentario: 'Melhor dia de CS da semana. Jogo perfeito.' } }),
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: casual.id_usuario,  id_jogo: jogos[4].id_jogo, data_jogada: new Date('2024-02-01'), comentario: 'Construindo uma nova cidade com amigos.' } }),
  ]);

  const atividades = [
    { id_usuario: gamer.id_usuario,  tipo: 'AVALIOU_JOGO',        id_jogo: jogos[0].id_jogo,  id_avaliacao: avaliacoes[0].id_avaliacao },
    { id_usuario: player.id_usuario, tipo: 'AVALIOU_JOGO',        id_jogo: jogos[2].id_jogo,  id_avaliacao: avaliacoes[5].id_avaliacao },
    { id_usuario: casual.id_usuario, tipo: 'AVALIOU_JOGO',        id_jogo: jogos[6].id_jogo,  id_avaliacao: avaliacoes[9].id_avaliacao },
    { id_usuario: gamer.id_usuario,  tipo: 'CRIOU_LISTA',         id_lista: lista1.id_lista   },
    { id_usuario: casual.id_usuario, tipo: 'CRIOU_LISTA',         id_lista: lista2.id_lista   },
    { id_usuario: player.id_usuario, tipo: 'CRIOU_LISTA',         id_lista: lista3.id_lista   },
    { id_usuario: gamer.id_usuario,  tipo: 'FAVORITOU_JOGO',      id_jogo: jogos[0].id_jogo   },
    { id_usuario: player.id_usuario, tipo: 'FAVORITOU_JOGO',      id_jogo: jogos[2].id_jogo   },
    { id_usuario: casual.id_usuario, tipo: 'FAVORITOU_JOGO',      id_jogo: jogos[6].id_jogo   },
    { id_usuario: gamer.id_usuario,  tipo: 'SEGUIU_USUARIO',      id_usuario_alvo: player.id_usuario },
    { id_usuario: player.id_usuario, tipo: 'SEGUIU_USUARIO',      id_usuario_alvo: gamer.id_usuario  },
    { id_usuario: gamer.id_usuario,  tipo: 'MUDOU_STATUS',        id_jogo: jogos[5].id_jogo,  dados_extras: 'JOGANDO' },
    { id_usuario: player.id_usuario, tipo: 'CURTIU_REVIEW',       id_avaliacao: avaliacoes[0].id_avaliacao },
    { id_usuario: gamer.id_usuario,  tipo: 'ADICIONOU_JOGO_LISTA',id_lista: lista1.id_lista,  id_jogo: jogos[0].id_jogo },
    { id_usuario: casual.id_usuario, tipo: 'CURTIU_LISTA',        id_lista: lista1.id_lista   },
  ];
  await Promise.all(atividades.map(a => prisma.tAB_ATIVIDADE.create({ data: a })));

  console.log('\n🎮 Seed v1.6 concluído!\n');
  console.log('   admin        / admin123');
  console.log('   gamer_br     / senha123');
  console.log('   player_one   / senha123');
  console.log('   casual_gamer / senha123\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

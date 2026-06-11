/**
 * Seed v1.9.2 — 60 jogos, reviews corrigidas, diário enriquecido
 * Os jogos são lidos de prisma/data/games.json para manter uma única fonte de verdade.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Checkpoint v1.9.2 — seed\n');

  // Limpar na ordem correta (dependências primeiro)
  await prisma.filaBusca.deleteMany();
  await prisma.tAB_BUSCA_JOGO.deleteMany();
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

  // ── Usuários ────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('senha123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  const [admin, gamer, player, casual] = await Promise.all([
    prisma.tAB_USUARIO.create({ data: {
      nm_usuario: 'admin',        email_usuario: 'admin@checkpoint.com',
      senha_usuario: adminHash,   tipo_usuario: 'ADMIN',
      bio_usuario:  'Administrador do Checkpoint.',
      img_usuario:  'https://api.dicebear.com/8.x/adventurer/svg?seed=admin',
    }}),
    prisma.tAB_USUARIO.create({ data: {
      nm_usuario: 'gamer_br',     email_usuario: 'gamer@checkpoint.com',
      senha_usuario: senhaHash,
      bio_usuario:  'Jogador hardcore. Zerador compulsivo. RPG é vida.',
      img_usuario:  'https://api.dicebear.com/8.x/adventurer/svg?seed=knight',
    }}),
    prisma.tAB_USUARIO.create({ data: {
      nm_usuario: 'player_one',   email_usuario: 'player@checkpoint.com',
      senha_usuario: senhaHash,
      bio_usuario:  'FPS competitivo e jogos indie. Sempre buscando desafios.',
      img_usuario:  'https://api.dicebear.com/8.x/adventurer/svg?seed=ninja',
    }}),
    prisma.tAB_USUARIO.create({ data: {
      nm_usuario: 'casual_gamer', email_usuario: 'casual@checkpoint.com',
      senha_usuario: senhaHash,
      bio_usuario:  'Jogo nos fins de semana. Amo histórias e mundo aberto.',
      img_usuario:  'https://api.dicebear.com/8.x/adventurer/svg?seed=explorer',
    }}),
  ]);
  console.log('✅ Usuários: admin / gamer_br / player_one / casual_gamer');

  // ── Follows ─────────────────────────────────────────────
  await Promise.all([
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: gamer.id_usuario,  id_usuario_seguido: player.id_usuario  }}),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: gamer.id_usuario,  id_usuario_seguido: casual.id_usuario  }}),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: player.id_usuario, id_usuario_seguido: gamer.id_usuario   }}),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: casual.id_usuario, id_usuario_seguido: gamer.id_usuario   }}),
    prisma.tAB_FOLLOW.create({ data: { id_usuario_seguidor: player.id_usuario, id_usuario_seguido: casual.id_usuario  }}),
  ]);

  // ── Jogos (lidos do JSON) ────────────────────────────────
  const jogosRaw: Array<{
    nm_jogo: string; img_jogo: string; genero: string; plataforma: string;
    classificacao: string; jogadores: string; descricao: string; dt_jogo: string;
  }> = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'games.json'), 'utf-8'));

  const jogos = await Promise.all(
    jogosRaw.map(j => prisma.tAB_JOGOS.create({
      data: { ...j, id_usuario: admin.id_usuario, dt_jogo: new Date(j.dt_jogo) },
    })),
  );
  console.log(`✅ ${jogos.length} jogos`);

  // Índices dos jogos no array (conforme games.json):
  // 0=TLOU2, 1=GoW Ragnarök, 2=Minecraft, 3=Elden Ring, 4=GTA V
  // 5=RDR2,  6=Hollow Knight, 7=Valorant, 8=Fortnite,  9=Zelda TotK
  // 10=Sekiro, 11=Dark Souls III, 12=Bloodborne, 13=Witcher 3, 14=Cyberpunk 2077
  // 15=Persona 5 Royal, 16=FF7 Remake, 17=Baldur's Gate 3, 18=MH World, 19=Nioh 2
  // 20=Dragon's Dogma 2, 21=Ghost of Tsushima, 22=Death Stranding, 23=Control, 24=Alan Wake 2
  // 25=Spider-Man MM, 26=Hogwarts Legacy, 27=Horizon FW, 28=AC Mirage, 29=Batman AK
  // 30=Death's Door, 31=DOOM Eternal, 32=Titanfall 2, 33=Metro Exodus, 34=Deathloop
  // 35=Returnal, 36=Atomic Heart, 37=Helldivers 2, 38=Celeste, 39=Hades
  // 40=Cuphead, 41=Ori WotW, 42=Tunic, 43=Inscryption, 44=Obra Dinn
  // 45=Outer Wilds, 46=Disco Elysium, 47=Undertale, 48=Stardew Valley, 49=Vampire Survivors
  // 50=Dave the Diver, 51=Slay the Spire, 52=RE Village, 53=RE4 Remake, 54=Dead Space
  // 55=Street Fighter 6, 56=Tekken 8, 57=Mortal Kombat 1, 58=Black Myth Wukong, 59=Metaphor ReFantazio

  // ── Avaliações ──────────────────────────────────────────
  const avDados = [
    // Elden Ring (3) — 3 reviews
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[3].id_jogo,  nota: 10, data_jogada: '2022-03-10', comentario: 'Obra-prima absoluta. Cada região esconde um segredo, cada boss é uma lição de humildade.' },
    { id_usuario: player.id_usuario, id_jogo: jogos[3].id_jogo,  nota: 9,  data_jogada: '2022-04-15', comentario: 'Difícil mas incrivelmente recompensador. A sensação de superar um boss é inigualável.' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[3].id_jogo,  nota: 7,  data_jogada: '2022-05-20', comentario: 'Muito difícil pra mim, mas entendo por que todos adoram. Desisti no Malenia.' },
    // God of War Ragnarök (1) — 2 reviews
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[1].id_jogo,  nota: 10, data_jogada: '2022-11-15', comentario: 'O melhor jogo de ação que já joguei. Kratos e Atreus têm uma das melhores dinâmicas de pai e filho.' },
    { id_usuario: casual.id_usuario, id_jogo: jogos[1].id_jogo,  nota: 9,  data_jogada: '2023-01-10', comentario: 'Superou o anterior em tudo. Me emocionei várias vezes. Thor é sensacional.' },
    // Hollow Knight (6) — 2 reviews
    { id_usuario: player.id_usuario, id_jogo: jogos[6].id_jogo,  nota: 10, data_jogada: '2021-08-15', comentario: 'Melhor metroidvania já feito. A atmosfera, o combate e o lore são perfeitos.' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[6].id_jogo,  nota: 9,  data_jogada: '2021-09-01', comentario: 'Difícil e gratificante. Cada área nova é uma surpresa. Hive Knight me destruiu.' },
    // RDR2 (5) — 2 reviews
    { id_usuario: casual.id_usuario, id_jogo: jogos[5].id_jogo,  nota: 10, data_jogada: '2021-12-25', comentario: 'A história de Arthur Morgan me fez chorar. Imersão em outro nível, parece um filme.' },
    { id_usuario: player.id_usuario, id_jogo: jogos[5].id_jogo,  nota: 8,  data_jogada: '2022-02-14', comentario: 'Mundo incrível com atenção absurda a detalhes. Às vezes lento mas vale cada segundo.' },
    // Valorant (7) — 1 review
    { id_usuario: player.id_usuario, id_jogo: jogos[7].id_jogo,  nota: 8,  data_jogada: '2023-10-05', comentario: 'FPS tático muito bem equilibrado. Os agentes adicionam camadas de estratégia que o CS não tem.' },
    // Hades (39) — 2 reviews
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[39].id_jogo, nota: 10, data_jogada: '2022-07-10', comentario: 'O roguelite perfeito. Nunca enjoa porque cada corrida avança a história e o personagem.' },
    { id_usuario: player.id_usuario, id_jogo: jogos[39].id_jogo, nota: 9,  data_jogada: '2022-09-20', comentario: 'Impossível parar. A integração entre narrativa e gameplay é genial. Zagreus é carismático.' },
    // Celeste (38) — 1 review
    { id_usuario: casual.id_usuario, id_jogo: jogos[38].id_jogo, nota: 9,  data_jogada: '2023-03-15', comentario: 'Me surpreendeu demais. A representação de saúde mental é honesta e a gameplay é precisa.' },
    // Zelda TotK (9) — 2 reviews
    { id_usuario: casual.id_usuario, id_jogo: jogos[9].id_jogo,  nota: 10, data_jogada: '2023-05-20', comentario: 'O sistema Ultrahand é revolucionário. Cada problema tem infinitas soluções criativas.' },
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[9].id_jogo,  nota: 9,  data_jogada: '2023-06-01', comentario: 'Superior ao BotW em sistemas mas o mapa reaproveitado decepciona um pouco.' },
    // TLOU2 (0) — 1 review
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[0].id_jogo,  nota: 9,  data_jogada: '2023-08-10', comentario: 'Narrativa corajosa e divisiva. A coragem em contar essa história é admirável.' },
    // Sekiro (10) — 1 review — novo jogo
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[10].id_jogo, nota: 10, data_jogada: '2024-01-15', comentario: 'O combate de precisão mais satisfatório que já senti num jogo. Isshin é o melhor boss da história.' },
    // The Witcher 3 (13) — 1 review — novo jogo
    { id_usuario: player.id_usuario, id_jogo: jogos[13].id_jogo, nota: 10, data_jogada: '2024-02-10', comentario: 'O mundo aberto mais vivo já criado. As escolhas morais importam e a escrita dos personagens é excepcional.' },
    // Cyberpunk 2077 (14) — 1 review — novo jogo
    { id_usuario: casual.id_usuario, id_jogo: jogos[14].id_jogo, nota: 8,  data_jogada: '2024-03-05', comentario: 'Night City é deslumbrante. A história de V me prendeu até o fim. Phantom Liberty é excelente.' },
    // Baldur's Gate 3 (17) — 1 review — novo jogo
    { id_usuario: gamer.id_usuario,  id_jogo: jogos[17].id_jogo, nota: 10, data_jogada: '2024-04-20', comentario: 'O maior RPG da geração. Jogamos 3 campanhas completas em co-op e cada uma foi completamente diferente.' },
    // Ghost of Tsushima (21) — 1 review — novo jogo
    { id_usuario: casual.id_usuario, id_jogo: jogos[21].id_jogo, nota: 9,  data_jogada: '2024-05-12', comentario: 'O Japão feudal mais bonito já renderizado. O modo foto virou um hobby separado.' },
    // Stardew Valley (48) — 1 review — novo jogo
    { id_usuario: casual.id_usuario, id_jogo: jogos[48].id_jogo, nota: 10, data_jogada: '2024-06-01', comentario: 'Já são 400 horas e ainda tenho coisas a descobrir. Terapêutico, viciante e feito por uma pessoa só.' },
    // RE Village (52) — 1 review — novo jogo
    { id_usuario: player.id_usuario, id_jogo: jogos[52].id_jogo, nota: 9,  data_jogada: '2024-07-08', comentario: 'Lady Dimitrescu é um fenômeno cultural. O jogo entrega em todas as frentes: horror, ação e narrativa.' },
  ];

  const avaliacoes = await Promise.all(
    avDados.map(a => prisma.tAB_AVALIACAO.create({
      data: { ...a, data_jogada: a.data_jogada ? new Date(a.data_jogada) : null },
    })),
  );
  console.log(`✅ ${avaliacoes.length} avaliações`);

  // ── Diário — espelha reviews do seed (auto-diary não roda no seed) ──
  await Promise.all(avDados.map(a =>
    prisma.tAB_DIARIO_JOGO.create({
      data: {
        id_usuario:  a.id_usuario,
        id_jogo:     a.id_jogo,
        data_jogada: a.data_jogada ? new Date(a.data_jogada) : new Date(),
        nota:        a.nota,
        comentario:  a.comentario,
      },
    }),
  ));
  // Entradas extras de sessão (sem avaliação formal)
  await Promise.all([
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[7].id_jogo,  data_jogada: new Date('2024-08-01'), nota: 8, comentario: 'Sessão ranqueada. Subiu de Bronze para Prata.' }}),
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[7].id_jogo,  data_jogada: new Date('2024-08-08'), nota: 7, comentario: 'Dia difícil. 3 derrotas seguidas.' }}),
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[8].id_jogo,  data_jogada: new Date('2024-07-20'), comentario: 'Ranked duos com amigo. 2 vitórias.' }}),
    prisma.tAB_DIARIO_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[2].id_jogo,  data_jogada: new Date('2024-09-10'), comentario: 'Construindo uma nova cidade medieval com o pessoal do servidor.' }}),
  ]);
  console.log(`✅ Diário: ${avDados.length} entradas automáticas + 4 extras`);

  // ── Reações ─────────────────────────────────────────────
  const reacoesData = [
    { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao,  tipo: 'LIKE'    },  // player likes gamer's Elden Ring review
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao,  tipo: 'LIKE'    },  // casual likes too
    { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[2].id_avaliacao,  tipo: 'DISLIKE' },  // gamer dislikes casual's "too hard" Elden Ring
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[5].id_avaliacao,  tipo: 'LIKE'    },  // casual likes player's Hollow Knight review
    { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[7].id_avaliacao,  tipo: 'LIKE'    },  // gamer likes casual's RDR2 review
    { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[10].id_avaliacao, tipo: 'LIKE'    },  // player likes gamer's Hades review
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[3].id_avaliacao,  tipo: 'LIKE'    },  // casual likes gamer's GoW review
    { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[13].id_avaliacao, tipo: 'LIKE'    },  // player likes casual's Zelda review
    { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[4].id_avaliacao,  tipo: 'DISLIKE' },  // gamer thinks 9/10 GoW is not enough
    { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[16].id_avaliacao, tipo: 'LIKE'    },  // casual likes gamer's Sekiro review
    { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[19].id_avaliacao, tipo: 'LIKE'    },  // player likes gamer's BG3 review
    { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[21].id_avaliacao, tipo: 'LIKE'    },  // gamer likes casual's Stardew review
  ].filter(r => {
    const av = avaliacoes.find(a => a.id_avaliacao === r.id_avaliacao);
    return av && av.id_usuario !== r.id_usuario;
  });

  await Promise.all(reacoesData.map(r => prisma.tAB_REACAO_REVIEW.create({ data: r })));
  console.log(`✅ ${reacoesData.length} reações`);

  // ── Comentários ─────────────────────────────────────────
  await Promise.all([
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao,  texto: 'Concordo! A área de Farum Azula é incrível. E o Elden Beast me surpreendeu.' }}),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[0].id_avaliacao,  texto: 'Precisei de guia nas últimas areas mas foi a melhor experiência que tive.' }}),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: gamer.id_usuario,   id_avaliacao: avaliacoes[7].id_avaliacao,  texto: 'Arthur Morgan é um dos personagens mais bem escritos da ficção, não só nos games.' }}),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[10].id_avaliacao, texto: 'O dash nunca enjoa. A satisfação de limpar o mapa num bom run é absurda.' }}),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: player.id_usuario,  id_avaliacao: avaliacoes[16].id_avaliacao, texto: 'Isshin é o pico do design de boss em games de ação. Que luta!' }}),
    prisma.tAB_COMENTARIO_REVIEW.create({ data: { id_usuario: casual.id_usuario,  id_avaliacao: avaliacoes[19].id_avaliacao, texto: 'Fizemos 4 jogadores com builds completamente diferentes e funcionou perfeitamente.' }}),
  ]);
  console.log('✅ Comentários');

  // ── Listas ──────────────────────────────────────────────
  const [lista1, lista2, lista3, lista4] = await Promise.all([
    prisma.tAB_LISTA.create({ data: { id_usuario: gamer.id_usuario,  nm_lista: 'RPGs Essenciais',              descricao: 'Os melhores RPGs que todo gamer deve jogar.',             publica: true }}),
    prisma.tAB_LISTA.create({ data: { id_usuario: casual.id_usuario, nm_lista: 'Para jogar no fim de semana', descricao: 'Jogos acessíveis e relaxantes para sessões curtas.',        publica: true }}),
    prisma.tAB_LISTA.create({ data: { id_usuario: player.id_usuario, nm_lista: 'Indies Incríveis',             descricao: 'A nata dos jogos independentes. Baratos e geniais.',       publica: true }}),
    prisma.tAB_LISTA.create({ data: { id_usuario: gamer.id_usuario,  nm_lista: 'Soulslike da dificuldade',     descricao: 'Para quem quer um desafio de verdade.',                    publica: true }}),
  ]);

  await Promise.all([
    // RPGs Essenciais
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[3].id_jogo,  position: 1 }}),  // Elden Ring
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[13].id_jogo, position: 2 }}),  // Witcher 3
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[17].id_jogo, position: 3 }}),  // Baldur's Gate 3
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista1.id_lista, id_jogo: jogos[15].id_jogo, position: 4 }}),  // Persona 5 Royal
    // Fim de semana
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista2.id_lista, id_jogo: jogos[48].id_jogo, position: 1 }}),  // Stardew Valley
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista2.id_lista, id_jogo: jogos[39].id_jogo, position: 2 }}),  // Hades
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista2.id_lista, id_jogo: jogos[50].id_jogo, position: 3 }}),  // Dave the Diver
    // Indies Incríveis
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[6].id_jogo,  position: 1 }}),  // Hollow Knight
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[38].id_jogo, position: 2 }}),  // Celeste
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[45].id_jogo, position: 3 }}),  // Outer Wilds
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista3.id_lista, id_jogo: jogos[46].id_jogo, position: 4 }}),  // Disco Elysium
    // Soulslike
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista4.id_lista, id_jogo: jogos[3].id_jogo,  position: 1 }}),  // Elden Ring
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista4.id_lista, id_jogo: jogos[11].id_jogo, position: 2 }}),  // Dark Souls III
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista4.id_lista, id_jogo: jogos[10].id_jogo, position: 3 }}),  // Sekiro
    prisma.tAB_LISTA_JOGO.create({ data: { id_lista: lista4.id_lista, id_jogo: jogos[12].id_jogo, position: 4 }}),  // Bloodborne
  ]);

  await Promise.all([
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: player.id_usuario,  id_lista: lista1.id_lista }}),
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: casual.id_usuario,  id_lista: lista1.id_lista }}),
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: gamer.id_usuario,   id_lista: lista2.id_lista }}),
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: player.id_usuario,  id_lista: lista3.id_lista }}),
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: casual.id_usuario,  id_lista: lista4.id_lista }}),
    prisma.tAB_LIKE_LISTA.create({ data: { id_usuario: player.id_usuario,  id_lista: lista4.id_lista }}),
  ]);
  console.log('✅ Listas e curtidas');

  // ── Vitrines (Top 4 de cada usuário) ────────────────────
  await Promise.all([
    // gamer_br
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[3].id_jogo,  status: 'ZERADO',  favorito: true, top_position: 1 }}),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[1].id_jogo,  status: 'ZERADO',  favorito: true, top_position: 2 }}),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[10].id_jogo, status: 'ZERADO',  favorito: true, top_position: 3 }}),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: gamer.id_usuario,  id_jogo: jogos[17].id_jogo, status: 'ZERADO',  favorito: true, top_position: 4 }}),
    // player_one
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[6].id_jogo,  status: 'ZERADO',  favorito: true, top_position: 1 }}),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[7].id_jogo,  status: 'JOGANDO', favorito: true, top_position: 2 }}),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: player.id_usuario, id_jogo: jogos[39].id_jogo, status: 'ZERADO',  favorito: true, top_position: 3 }}),
    // casual_gamer
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[5].id_jogo,  status: 'ZERADO',  favorito: true, top_position: 1 }}),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[9].id_jogo,  status: 'ZERADO',  favorito: true, top_position: 2 }}),
    prisma.tAB_STATUS_JOGO.create({ data: { id_usuario: casual.id_usuario, id_jogo: jogos[48].id_jogo, status: 'ZERADO',  favorito: true, top_position: 3 }}),
  ]);
  console.log('✅ Vitrines');

  // ── Atividades (feed) ────────────────────────────────────
  await Promise.all([
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: gamer.id_usuario,  tipo: 'AVALIOU_JOGO',         id_jogo: jogos[3].id_jogo,  id_avaliacao: avaliacoes[0].id_avaliacao }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: player.id_usuario, tipo: 'AVALIOU_JOGO',         id_jogo: jogos[6].id_jogo,  id_avaliacao: avaliacoes[5].id_avaliacao }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: casual.id_usuario, tipo: 'AVALIOU_JOGO',         id_jogo: jogos[5].id_jogo,  id_avaliacao: avaliacoes[7].id_avaliacao }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: gamer.id_usuario,  tipo: 'AVALIOU_JOGO',         id_jogo: jogos[39].id_jogo, id_avaliacao: avaliacoes[10].id_avaliacao }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: gamer.id_usuario,  tipo: 'AVALIOU_JOGO',         id_jogo: jogos[10].id_jogo, id_avaliacao: avaliacoes[16].id_avaliacao }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: gamer.id_usuario,  tipo: 'AVALIOU_JOGO',         id_jogo: jogos[17].id_jogo, id_avaliacao: avaliacoes[19].id_avaliacao }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: gamer.id_usuario,  tipo: 'CRIOU_LISTA',          id_lista: lista1.id_lista }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: casual.id_usuario, tipo: 'CRIOU_LISTA',          id_lista: lista2.id_lista }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: player.id_usuario, tipo: 'CRIOU_LISTA',          id_lista: lista3.id_lista }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: gamer.id_usuario,  tipo: 'CRIOU_LISTA',          id_lista: lista4.id_lista }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: gamer.id_usuario,  tipo: 'FAVORITOU_JOGO',       id_jogo: jogos[3].id_jogo  }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: casual.id_usuario, tipo: 'FAVORITOU_JOGO',       id_jogo: jogos[5].id_jogo  }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: player.id_usuario, tipo: 'FAVORITOU_JOGO',       id_jogo: jogos[6].id_jogo  }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: gamer.id_usuario,  tipo: 'SEGUIU_USUARIO',       id_usuario_alvo: player.id_usuario }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: player.id_usuario, tipo: 'SEGUIU_USUARIO',       id_usuario_alvo: gamer.id_usuario  }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: player.id_usuario, tipo: 'CURTIU_REVIEW',        id_avaliacao: avaliacoes[0].id_avaliacao }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: casual.id_usuario, tipo: 'CURTIU_LISTA',         id_lista: lista4.id_lista }}),
    prisma.tAB_ATIVIDADE.create({ data: { id_usuario: gamer.id_usuario,  tipo: 'ADICIONOU_JOGO_LISTA', id_lista: lista4.id_lista, id_jogo: jogos[10].id_jogo }}),
  ]);
  console.log('✅ Atividades (feed)');

  console.log('\n🎮 Seed v1.9.2 concluído!\n');
  console.log('   admin        → admin@checkpoint.com   / admin123');
  console.log('   gamer_br     → gamer@checkpoint.com   / senha123');
  console.log('   player_one   → player@checkpoint.com  / senha123');
  console.log('   casual_gamer → casual@checkpoint.com  / senha123\n');
  console.log(`   📦 ${jogos.length} jogos | ${avaliacoes.length} avaliações | ${avDados.length + 4} entradas no diário\n`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

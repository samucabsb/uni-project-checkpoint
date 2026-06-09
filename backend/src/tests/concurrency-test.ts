/**
 * concurrency-test.ts — Checkpoint v1.10
 *
 * Script de teste automatizado de concorrência.
 * Simula múltiplos usuários realizando ações simultâneas.
 *
 * Cenários testados:
 *   1. CONFLITO: mesmo usuário avalia o mesmo jogo 10x simultaneamente
 *      → Esperado: 1 sucesso (201) + 9 conflitos (409)
 *
 *   2. MULTI-USUÁRIO: 3 usuários diferentes avaliam o mesmo jogo simultaneamente
 *      → Esperado: 3 sucessos (201) — sem conflito
 *
 *   3. FOLLOW: mesmo usuário tenta seguir o mesmo perfil 5x simultaneamente
 *      → Esperado: 1 sucesso (201) + 4 conflitos (409)
 *
 * Como executar:
 *   npx tsx src/tests/concurrency-test.ts
 *
 * Requisito: backend rodando em http://localhost:3333
 */

const BASE_URL = 'http://localhost:3333/api';

// ── Credenciais dos usuários de teste ────────────────────────
const USUARIOS = {
  gamer_br:     { nm_usuario: 'gamer_br',     senha_usuario: 'senha123' },
  player_one:   { nm_usuario: 'player_one',   senha_usuario: 'senha123' },
  casual_gamer: { nm_usuario: 'casual_gamer', senha_usuario: 'senha123' },
};

// ── ID do jogo usado no teste (Elden Ring = ID 4 no seed padrão) ──
// Se o seed foi resetado, buscar o ID correto pela API
const JOGO_TESTE_NOME = 'Elden Ring';
const USUARIO_ALVO_NOME = 'admin'; // Para teste de follow

// ── Utilitários ──────────────────────────────────────────────

async function login(credenciais: { nm_usuario: string; senha_usuario: string }): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(credenciais),
  });
  const data = await res.json() as { token?: string; message?: string };
  if (!data.token) throw new Error(`Login falhou para ${credenciais.nm_usuario}: ${data.message}`);
  return data.token;
}

async function buscarJogoId(token: string): Promise<number> {
  const res  = await fetch(`${BASE_URL}/games/search?q=${encodeURIComponent(JOGO_TESTE_NOME)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json() as Array<{ id_jogo: number; nm_jogo: string }>;
  if (!data.length) throw new Error(`Jogo "${JOGO_TESTE_NOME}" não encontrado no banco.`);
  return data[0].id_jogo;
}

async function buscarUsuarioId(token: string, nome: string): Promise<number> {
  const res  = await fetch(`${BASE_URL}/users/search?q=${nome}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json() as Array<{ id_usuario: number; nm_usuario: string }>;
  const user = data.find(u => u.nm_usuario === nome);
  if (!user) throw new Error(`Usuário "${nome}" não encontrado.`);
  return user.id_usuario;
}

async function deletarAvaliacao(token: string, idJogo: number): Promise<void> {
  // Busca avaliação existente para deletar antes do teste
  const res = await fetch(`${BASE_URL}/games/${idJogo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const jogo = await res.json() as {
    avaliacoes: Array<{ id_avaliacao: number; usuario: { nm_usuario: string } }>;
  };

  // Pega o token decodificado para saber qual usuário é
  const meRes  = await fetch(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const me     = await meRes.json() as { nm_usuario: string };
  const minhaAv = jogo.avaliacoes.find(a => a.usuario.nm_usuario === me.nm_usuario);

  if (minhaAv) {
    await fetch(`${BASE_URL}/reviews/${minhaAv.id_avaliacao}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
  }
}

async function deseguir(token: string, idAlvo: number): Promise<void> {
  await fetch(`${BASE_URL}/users/${idAlvo}/unfollow`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Cenário 1: Conflito de avaliação simultânea ──────────────

async function testarConflitoConcorrente(token: string, idJogo: number): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('CENÁRIO 1 — Conflito de avaliação simultânea');
  console.log('Usuário: gamer_br | Jogo: ' + JOGO_TESTE_NOME);
  console.log('Disparando 10 requisições simultâneas...');
  console.log('='.repeat(60));

  // Limpar avaliação anterior (se existir)
  await deletarAvaliacao(token, idJogo);

  const TOTAL = 10;
  const inicio = Date.now();

  const requests = Array.from({ length: TOTAL }).map((_, i) =>
    fetch(`${BASE_URL}/reviews`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify({
        id_jogo:    idJogo,
        nota:       10,
        comentario: `Teste de concorrência #${i + 1}`,
      }),
    }).then(async r => ({ status: r.status, body: await r.json() }))
  );

  const resultados = await Promise.allSettled(requests);
  const duracao    = Date.now() - inicio;

  let sucessos = 0, conflitos = 0, outros = 0;

  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const { status } = r.value;
      if (status === 201 || status === 200) { sucessos++; console.log(`  [${i + 1}] ✅ ${status} — Avaliação criada`); }
      else if (status === 409)              { conflitos++; console.log(`  [${i + 1}] ⚠️  409 — Conflito detectado (esperado)`); }
      else                                  { outros++;    console.log(`  [${i + 1}] ❓ ${status} — ${JSON.stringify(r.value.body)}`); }
    } else {
      outros++;
      console.log(`  [${i + 1}] ❌ Erro de rede: ${r.reason}`);
    }
  });

  console.log('\n📊 Resultado:');
  console.log(`   Sucessos (201/200): ${sucessos}`);
  console.log(`   Conflitos (409):    ${conflitos}`);
  console.log(`   Outros:             ${outros}`);
  console.log(`   Duração:            ${duracao}ms`);

  const consistente = sucessos <= 1 && conflitos >= TOTAL - 1 - outros;
  console.log(`\n${consistente ? '✅ CONSISTÊNCIA MANTIDA' : '❌ INCONSISTÊNCIA DETECTADA'}`);
  if (!consistente) {
    console.log(`   ⚠️  Esperado: máx 1 sucesso + resto conflitos. Obtido: ${sucessos} sucessos.`);
  }
}

// ── Cenário 2: Multi-usuário simultâneo ──────────────────────

async function testarMultiUsuario(
  tokens: { gamer: string; player: string; casual: string },
  idJogo: number
): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('CENÁRIO 2 — Múltiplos usuários diferentes, mesmo jogo');
  console.log('gamer_br + player_one + casual_gamer → Elden Ring simultâneo');
  console.log('Disparando 3 requisições simultâneas...');
  console.log('='.repeat(60));

  // Limpar avaliações anteriores
  await Promise.all([
    deletarAvaliacao(tokens.gamer,  idJogo),
    deletarAvaliacao(tokens.player, idJogo),
    deletarAvaliacao(tokens.casual, idJogo),
  ]);

  const inicio = Date.now();

  const [r1, r2, r3] = await Promise.allSettled([
    fetch(`${BASE_URL}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.gamer}` },
      body:   JSON.stringify({ id_jogo: idJogo, nota: 10, comentario: 'gamer_br simultâneo' }),
    }).then(async r => ({ status: r.status, body: await r.json(), usuario: 'gamer_br' })),

    fetch(`${BASE_URL}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.player}` },
      body:   JSON.stringify({ id_jogo: idJogo, nota: 9, comentario: 'player_one simultâneo' }),
    }).then(async r => ({ status: r.status, body: await r.json(), usuario: 'player_one' })),

    fetch(`${BASE_URL}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.casual}` },
      body:   JSON.stringify({ id_jogo: idJogo, nota: 8, comentario: 'casual_gamer simultâneo' }),
    }).then(async r => ({ status: r.status, body: await r.json(), usuario: 'casual_gamer' })),
  ]);

  const duracao = Date.now() - inicio;
  let sucessos = 0;

  [r1, r2, r3].forEach(r => {
    if (r.status === 'fulfilled') {
      const { status, usuario } = r.value;
      console.log(`  [${usuario}] ${status === 201 || status === 200 ? '✅' : '❌'} ${status}`);
      if (status === 201 || status === 200) sucessos++;
    }
  });

  console.log('\n📊 Resultado:');
  console.log(`   Sucessos: ${sucessos}/3`);
  console.log(`   Duração:  ${duracao}ms`);
  console.log(`\n${sucessos === 3 ? '✅ SISTEMA SUPORTA MÚLTIPLOS USUÁRIOS SIMULTÂNEOS' : '❌ FALHA: nem todos os usuários conseguiram avaliar'}`);
}

// ── Cenário 3: Conflito de follow simultâneo ─────────────────

async function testarFollowConcorrente(token: string, idAlvo: number): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('CENÁRIO 3 — Conflito de follow simultâneo');
  console.log(`Usuário: gamer_br → segue "${USUARIO_ALVO_NOME}" 5x ao mesmo tempo`);
  console.log('='.repeat(60));

  // Limpar follow anterior
  await deseguir(token, idAlvo);

  const TOTAL  = 5;
  const inicio = Date.now();

  const requests = Array.from({ length: TOTAL }).map(() =>
    fetch(`${BASE_URL}/users/${idAlvo}/follow`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).then(async r => ({ status: r.status, body: await r.json() }))
  );

  const resultados = await Promise.allSettled(requests);
  const duracao    = Date.now() - inicio;

  let sucessos = 0, conflitos = 0, outros = 0;

  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const { status } = r.value;
      if (status === 201 || status === 200) { sucessos++; console.log(`  [${i + 1}] ✅ ${status} — Follow criado`); }
      else if (status === 409)              { conflitos++; console.log(`  [${i + 1}] ⚠️  409 — Conflito detectado (esperado)`); }
      else                                  { outros++;    console.log(`  [${i + 1}] ❓ ${status} — ${JSON.stringify(r.value.body)}`); }
    } else {
      outros++;
    }
  });

  console.log('\n📊 Resultado:');
  console.log(`   Sucessos (201):  ${sucessos}`);
  console.log(`   Conflitos (409): ${conflitos}`);
  console.log(`   Duração:         ${duracao}ms`);
  console.log(`\n${sucessos <= 1 ? '✅ CONSISTÊNCIA MANTIDA — no máximo 1 follow criado' : '❌ INCONSISTÊNCIA — múltiplos follows duplicados'}`);
}

// ── Runner principal ──────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🎮 CHECKPOINT v1.10 — TESTE DE CONCORRÊNCIA');
  console.log('='.repeat(60));
  console.log(`Backend: ${BASE_URL}`);
  console.log(`Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);

  // Login de todos os usuários
  console.log('🔐 Fazendo login dos usuários de teste...');
  let tokenGamer: string, tokenPlayer: string, tokenCasual: string;

  try {
    [tokenGamer, tokenPlayer, tokenCasual] = await Promise.all([
      login(USUARIOS.gamer_br),
      login(USUARIOS.player_one),
      login(USUARIOS.casual_gamer),
    ]);
    console.log('✅ Todos os usuários autenticados\n');
  } catch (e) {
    console.error('❌ Falha no login:', e);
    console.error('   Certifique-se de que o backend está rodando em', BASE_URL);
    process.exit(1);
  }

  // Buscar IDs necessários
  console.log('🔍 Buscando IDs de entidades de teste...');
  let idJogo: number, idAlvo: number;

  try {
    [idJogo, idAlvo] = await Promise.all([
      buscarJogoId(tokenGamer),
      buscarUsuarioId(tokenGamer, USUARIO_ALVO_NOME),
    ]);
    console.log(`✅ Jogo "${JOGO_TESTE_NOME}" → ID ${idJogo}`);
    console.log(`✅ Usuário "${USUARIO_ALVO_NOME}" → ID ${idAlvo}`);
  } catch (e) {
    console.error('❌ Erro ao buscar entidades:', e);
    process.exit(1);
  }

  // Executar cenários
  await testarConflitoConcorrente(tokenGamer, idJogo);
  await testarMultiUsuario({ gamer: tokenGamer, player: tokenPlayer, casual: tokenCasual }, idJogo);
  await testarFollowConcorrente(tokenGamer, idAlvo);

  console.log('\n' + '='.repeat(60));
  console.log('✅ SUITE DE TESTES CONCLUÍDA');
  console.log('='.repeat(60));
  console.log('Evidências geradas nos logs acima.');
  console.log('Para re-executar: npx tsx src/tests/concurrency-test.ts\n');
}

main().catch(err => {
  console.error('\n❌ Erro fatal no teste:', err);
  process.exit(1);
});

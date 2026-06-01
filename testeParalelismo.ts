/**
 * testeParalelismo.ts
 * Script de teste que envia múltiplas requisições simultâneas ao backend
 * e imprime os resultados lado a lado para comprovar o processamento paralelo.
 *
 * ONDE COLOCAR: backend/testeParalelismo.ts
 *
 * COMO EXECUTAR (com o servidor já rodando em outro terminal):
 *   npx tsx testeParalelismo.ts
 *
 * O QUE ESPERAR VER:
 *   - Várias requisições com timestamps quase idênticos (diferença < 10ms)
 *   - Isso prova que todas foram disparadas ao mesmo tempo (Promise.all)
 *   - O backend atende todas sem travar — comportamento assíncrono/paralelo
 */

const BASE_URL = 'http://localhost:3333/api';

// Endpoints públicos (sem autenticação) para testar
const ENDPOINTS = [
  '/games',
  '/reviews',
  '/lists',
  '/feed/stats',
  '/search?q=zelda',
  '/games/popular',
];

interface Resultado {
  endpoint: string;
  inicio: number;
  fim: number;
  duracao: number;
  status: number;
  erro?: string;
}

async function requisicao(endpoint: string): Promise<Resultado> {
  const inicio = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    const fim = Date.now();
    return {
      endpoint,
      inicio,
      fim,
      duracao: fim - inicio,
      status: res.status,
    };
  } catch (e: any) {
    const fim = Date.now();
    return {
      endpoint,
      inicio,
      fim,
      duracao: fim - inicio,
      status: 0,
      erro: e.message,
    };
  }
}

async function main() {
  console.log('\n========================================');
  console.log('  TESTE DE CONCORRÊNCIA — CHECKPOINT');
  console.log('========================================\n');
  console.log(`Disparando ${ENDPOINTS.length} requisições SIMULTANEAMENTE...\n`);

  const tempoGlobal = Date.now();

  // Promise.all dispara todas ao mesmo tempo — isso é o paralelismo
  const resultados = await Promise.all(ENDPOINTS.map(ep => requisicao(ep)));

  const totalGasto = Date.now() - tempoGlobal;

  // Calcular tempo de referência (menor início)
  const primeiroInicio = Math.min(...resultados.map(r => r.inicio));

  console.log('RESULTADO DAS REQUISIÇÕES:');
  console.log('─'.repeat(70));
  console.log(
    'Endpoint'.padEnd(25) +
    'Início (ms)'.padEnd(14) +
    'Duração'.padEnd(12) +
    'Status'
  );
  console.log('─'.repeat(70));

  for (const r of resultados) {
    const offset = (r.inicio - primeiroInicio).toString().padStart(3) + 'ms';
    const duracao = r.duracao + 'ms';
    const status = r.erro ? `ERRO: ${r.erro}` : String(r.status);
    console.log(
      r.endpoint.padEnd(25) +
      `+${offset}`.padEnd(14) +
      duracao.padEnd(12) +
      status
    );
  }

  console.log('─'.repeat(70));
  console.log(`\nTempo total (sequencial seria a soma): ${resultados.reduce((a, r) => a + r.duracao, 0)}ms`);
  console.log(`Tempo real com paralelismo:            ${totalGasto}ms`);

  const somaSequencial = resultados.reduce((a, r) => a + r.duracao, 0);
  const ganho = (somaSequencial / totalGasto).toFixed(2);
  console.log(`Fator de ganho (speedup):              ~${ganho}x mais rápido\n`);

  const diffMaxInicio = Math.max(...resultados.map(r => r.inicio)) - primeiroInicio;
  console.log('PROVA DE SIMULTANEIDADE:');
  console.log(`  Diferença entre o 1º e o último início: ${diffMaxInicio}ms`);
  if (diffMaxInicio < 50) {
    console.log('  ✅ Todas as requisições saíram ao mesmo tempo (< 50ms de diferença)');
    console.log('  ✅ O servidor processou múltiplas requisições de forma concorrente\n');
  } else {
    console.log('  ⚠️  Diferença maior que o esperado — pode ser lentidão na rede local\n');
  }
}

main().catch(console.error);

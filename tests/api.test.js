// Testes HTTP reais: sobe o app numa porta livre e usa o fetch nativo do Node (18+).
const app = require('../src/app');
const pedidoService = require('../src/services/pedidoService');

let servidor;
let base;

beforeAll(done => {
  servidor = app.listen(0, () => {
    base = `http://localhost:${servidor.address().port}`;
    done();
  });
});

afterAll(done => {
  servidor.close(done);
});
beforeEach(() => pedidoService.resetar());

const json = (metodo, caminho, corpo) =>
  fetch(base + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo)
  });

const novo = { cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal' };

test('POST /pedidos válido -> 201', async () => {
  const res = await json('POST', '/pedidos', novo);
  expect(res.status).toBe(201);
  expect(await res.json()).toEqual({ id: 1, ...novo, status: 'recebido' });
});

test('POST /pedidos inválido -> 400 com mensagem JSON', async () => {
  const res = await json('POST', '/pedidos', { ...novo, cliente: '   ' });
  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ erro: 'O cliente é obrigatório.' });
});

test('POST /pedidos sem body -> 400 (não vaza erro interno)', async () => {
  const res = await fetch(base + '/pedidos', { method: 'POST' });
  expect(res.status).toBe(400);
  expect((await res.json()).erro).not.toMatch(/destructure/i);
});

test('POST /pedidos com JSON malformado -> 400 em JSON', async () => {
  const res = await fetch(base + '/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ cliente: '
  });
  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ erro: 'JSON inválido no corpo da requisição.' });
});

test('GET /pedidos -> 200 com lista', async () => {
  await json('POST', '/pedidos', novo);
  const res = await json('GET', '/pedidos');
  expect(res.status).toBe(200);
  expect(await res.json()).toHaveLength(1);
});

test('GET /pedidos/:id existente -> 200 e inexistente -> 404', async () => {
  await json('POST', '/pedidos', novo);
  expect((await json('GET', '/pedidos/1')).status).toBe(200);
  expect((await json('GET', '/pedidos/999')).status).toBe(404);
});

test('PATCH /pedidos/:id/status: 200, 400 e 404', async () => {
  await json('POST', '/pedidos', novo);

  const ok = await json('PATCH', '/pedidos/1/status', { status: 'em_preparacao' });
  expect(ok.status).toBe(200);
  expect((await ok.json()).status).toBe('em_preparacao');

  expect((await json('PATCH', '/pedidos/1/status', { status: 'voando' })).status).toBe(400);
  expect((await json('PATCH', '/pedidos/1/status', { status: 'entregue' })).status).toBe(400);
  expect((await fetch(base + '/pedidos/1/status', { method: 'PATCH' })).status).toBe(400);
  expect((await json('PATCH', '/pedidos/999/status', { status: 'cancelado' })).status).toBe(404);
});

test('rota inexistente -> 404 em JSON', async () => {
  const res = await json('GET', '/nada');
  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ erro: 'Rota não encontrada.' });
});

test('erro inesperado -> 500 sem detalhes internos', async () => {
  const espiao = jest.spyOn(pedidoService, 'listar').mockImplementation(() => {
    throw new Error('falha secreta de banco');
  });
  const silencio = jest.spyOn(console, 'error').mockImplementation(() => {});

  const res = await json('GET', '/pedidos');
  expect(res.status).toBe(500);
  expect(await res.json()).toEqual({ erro: 'Erro interno do servidor.' });

  espiao.mockRestore();
  silencio.mockRestore();
});

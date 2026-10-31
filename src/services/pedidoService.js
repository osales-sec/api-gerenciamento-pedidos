const ErroValidacao = require('../errors/ErroValidacao');
const ErroNaoEncontrado = require('../errors/ErroNaoEncontrado');

let pedidos = [];
let proximoId = 1;

const tiposPermitidos = ['entrega', 'retirada'];
const prioridadesPermitidas = ['baixa', 'normal', 'alta'];
const statusPermitidos = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];

const transicoes = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: []
};

function criar(dados) {
  if (dados === null || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ErroValidacao('O corpo da requisição deve ser um objeto JSON.');
  }

  const { cliente, tipo, valor, prioridade } = dados;

  if (typeof cliente !== 'string' || !cliente.trim()) {
    throw new ErroValidacao('O cliente é obrigatório.');
  }

  if (!tiposPermitidos.includes(tipo)) {
    throw new ErroValidacao('Tipo inválido. Use entrega ou retirada.');
  }

  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw new ErroValidacao('O valor deve ser um número maior que zero.');
  }

  if (!prioridadesPermitidas.includes(prioridade)) {
    throw new ErroValidacao('Prioridade inválida. Use baixa, normal ou alta.');
  }

  const pedido = {
    id: proximoId++,
    cliente: cliente.trim(),
    tipo,
    valor,
    prioridade,
    status: 'recebido'
  };

  pedidos.push(pedido);
  return { ...pedido };
}

function listar() {
  // devolve cópias para quem chamou não alterar o armazenamento interno
  return pedidos.map(pedido => ({ ...pedido }));
}

// Uso interno: devolve a referência real (ou undefined). ID só aceita dígitos.
function localizar(id) {
  if (!/^\d+$/.test(String(id))) {
    return undefined;
  }
  return pedidos.find(pedido => pedido.id === Number(id));
}

function buscarPorId(id) {
  const pedido = localizar(id);

  if (!pedido) {
    throw new ErroNaoEncontrado();
  }

  return { ...pedido };
}

function atualizarStatus(id, novoStatus) {
  const pedido = localizar(id);

  if (!pedido) {
    throw new ErroNaoEncontrado();
  }

  if (!statusPermitidos.includes(novoStatus)) {
    throw new ErroValidacao(
      'Status inválido. Use recebido, em_preparacao, enviado, entregue ou cancelado.'
    );
  }

  if (!transicoes[pedido.status].includes(novoStatus)) {
    throw new ErroValidacao(
      `Transição de status não permitida: ${pedido.status} -> ${novoStatus}.`
    );
  }

  pedido.status = novoStatus;
  return { ...pedido };
}

// Usado apenas nos testes para começar cada teste com o armazenamento limpo.
function resetar() {
  pedidos = [];
  proximoId = 1;
}

module.exports = { criar, listar, buscarPorId, atualizarStatus, resetar };

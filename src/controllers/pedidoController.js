const pedidoService = require('../services/pedidoService');

// O controller só traduz HTTP <-> service.
// Erros lançados pelo service (ErroValidacao / ErroNaoEncontrado) são
// capturados automaticamente pelo Express 5 e tratados no middleware.

function criar(req, res) {
  const pedido = pedidoService.criar(req.body);
  return res.status(201).json(pedido);
}

function listar(req, res) {
  return res.status(200).json(pedidoService.listar());
}

function buscarPorId(req, res) {
  const pedido = pedidoService.buscarPorId(req.params.id);
  return res.status(200).json(pedido);
}

function atualizarStatus(req, res) {
  const pedido = pedidoService.atualizarStatus(req.params.id, req.body?.status);
  return res.status(200).json(pedido);
}

module.exports = { criar, listar, buscarPorId, atualizarStatus };

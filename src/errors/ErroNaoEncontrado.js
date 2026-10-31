// Erro lançado quando um recurso não existe (vira HTTP 404).
class ErroNaoEncontrado extends Error {
  constructor(mensagem = 'Pedido não encontrado.') {
    super(mensagem);
    this.name = 'ErroNaoEncontrado';
  }
}

module.exports = ErroNaoEncontrado;

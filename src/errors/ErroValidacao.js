// Erro lançado quando os dados enviados pelo usuário são inválidos (vira HTTP 400).
class ErroValidacao extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroValidacao';
  }
}

module.exports = ErroValidacao;

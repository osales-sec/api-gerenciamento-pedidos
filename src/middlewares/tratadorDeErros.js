const ErroValidacao = require('../errors/ErroValidacao');
const ErroNaoEncontrado = require('../errors/ErroNaoEncontrado');

// Rota inexistente -> 404 em JSON
function rotaNaoEncontrada(req, res) {
  return res.status(404).json({ erro: 'Rota não encontrada.' });
}

// Único lugar que decide o código HTTP a partir do tipo do erro.
// eslint-disable-next-line no-unused-vars
function tratadorDeErros(erro, req, res, next) {
  if (erro instanceof ErroValidacao) {
    return res.status(400).json({ erro: erro.message });
  }

  if (erro instanceof ErroNaoEncontrado) {
    return res.status(404).json({ erro: erro.message });
  }

  // JSON malformado enviado pelo cliente (erro do express.json)
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  // Qualquer outra coisa é erro inesperado: não expõe detalhes internos.
  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, tratadorDeErros };

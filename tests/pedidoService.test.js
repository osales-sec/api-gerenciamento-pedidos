const pedidoService = require('../src/services/pedidoService');
const ErroValidacao = require('../src/errors/ErroValidacao');
const ErroNaoEncontrado = require('../src/errors/ErroNaoEncontrado');

const pedidoValido = {
  cliente: 'Maria Silva',
  tipo: 'entrega',
  valor: 100,
  prioridade: 'normal'
};

beforeEach(() => pedidoService.resetar());

describe('criar', () => {
  test('cadastra pedido válido com status recebido e remove espaços do cliente', () => {
    const pedido = pedidoService.criar({ ...pedidoValido, cliente: '  Maria Silva  ' });
    expect(pedido).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test.each([
    ['cliente vazio', { cliente: '   ' }, 'O cliente é obrigatório.'],
    ['cliente não texto', { cliente: 123 }, 'O cliente é obrigatório.'],
    ['valor zero', { valor: 0 }, 'O valor deve ser um número maior que zero.'],
    ['valor negativo', { valor: -5 }, 'O valor deve ser um número maior que zero.'],
    ['valor em texto', { valor: '50' }, 'O valor deve ser um número maior que zero.'],
    ['tipo desconhecido', { tipo: 'voador' }, 'Tipo inválido. Use entrega ou retirada.'],
    ['prioridade desconhecida', { prioridade: 'urgente' }, 'Prioridade inválida. Use baixa, normal ou alta.']
  ])('rejeita %s', (_nome, alteracao, mensagem) => {
    expect(() => pedidoService.criar({ ...pedidoValido, ...alteracao }))
      .toThrow(new ErroValidacao(mensagem));
  });

  test('rejeita corpo ausente', () => {
    expect(() => pedidoService.criar(undefined)).toThrow(ErroValidacao);
    expect(() => pedidoService.criar(null)).toThrow(ErroValidacao);
  });
});

describe('listar e buscarPorId', () => {
  test('lista os pedidos cadastrados', () => {
    pedidoService.criar(pedidoValido);
    pedidoService.criar(pedidoValido);
    expect(pedidoService.listar()).toHaveLength(2);
  });

  test('alterar o resultado de listar não altera o armazenamento', () => {
    pedidoService.criar(pedidoValido);
    pedidoService.listar().length = 0;
    expect(pedidoService.listar()).toHaveLength(1);
  });

  test('busca pedido existente', () => {
    const criado = pedidoService.criar(pedidoValido);
    expect(pedidoService.buscarPorId(criado.id)).toEqual(criado);
  });

  test.each(['999', '1abc', '1.0', '1e0', '0x1', ''])(
    'id inexistente ou malformado "%s" gera ErroNaoEncontrado',
    id => {
      pedidoService.criar(pedidoValido);
      expect(() => pedidoService.buscarPorId(id)).toThrow(ErroNaoEncontrado);
    }
  );
});

describe('atualizarStatus', () => {
  test('segue o fluxo recebido -> em_preparacao -> enviado -> entregue', () => {
    const { id } = pedidoService.criar(pedidoValido);
    expect(pedidoService.atualizarStatus(id, 'em_preparacao').status).toBe('em_preparacao');
    expect(pedidoService.atualizarStatus(id, 'enviado').status).toBe('enviado');
    expect(pedidoService.atualizarStatus(id, 'entregue').status).toBe('entregue');
  });

  test('permite cancelar um pedido recebido', () => {
    const { id } = pedidoService.criar(pedidoValido);
    expect(pedidoService.atualizarStatus(id, 'cancelado').status).toBe('cancelado');
  });

  test('rejeita pular etapa (recebido -> enviado)', () => {
    const { id } = pedidoService.criar(pedidoValido);
    expect(() => pedidoService.atualizarStatus(id, 'enviado')).toThrow(ErroValidacao);
  });

  test('rejeita sair de estado final', () => {
    const { id } = pedidoService.criar(pedidoValido);
    pedidoService.atualizarStatus(id, 'cancelado');
    expect(() => pedidoService.atualizarStatus(id, 'em_preparacao')).toThrow(ErroValidacao);
  });

  test('rejeita status desconhecido ou ausente', () => {
    const { id } = pedidoService.criar(pedidoValido);
    expect(() => pedidoService.atualizarStatus(id, 'voando')).toThrow(ErroValidacao);
    expect(() => pedidoService.atualizarStatus(id, undefined)).toThrow(ErroValidacao);
  });

  test('id inexistente gera ErroNaoEncontrado mesmo com status inválido', () => {
    expect(() => pedidoService.atualizarStatus(99, 'voando')).toThrow(ErroNaoEncontrado);
  });
});

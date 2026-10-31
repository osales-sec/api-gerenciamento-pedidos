# API de Gerenciamento de Pedidos

API REST para gerenciar pedidos de uma pequena loja, feita para a disciplina
**Tópicos Avançados em Sistemas de Informação II**.
Tecnologias: Node.js, Express 5, JavaScript, Jest, Postman, Git/GitHub.
Os pedidos ficam **em memória** (reiniciar o servidor apaga os dados).

## Como instalar e executar

```bash
npm install
npm start        # sobe em http://localhost:3000 (ou na porta definida em PORT)
npm test         # executa os testes automatizados (Jest)
```

Requer Node.js 18 ou superior (os testes HTTP usam o `fetch` nativo).

## Valores aceitos

| Campo | Regra |
|---|---|
| `cliente` | texto obrigatório; espaços nas pontas são removidos; só espaços = inválido |
| `tipo` | `entrega` ou `retirada` |
| `valor` | número (JSON number) maior que zero; texto como `"50"` é rejeitado |
| `prioridade` | `baixa`, `normal` ou `alta` |
| `status` | `recebido`, `em_preparacao`, `enviado`, `entregue`, `cancelado` |

### Transições de status permitidas

| De | Para |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue`, `cancelado` | (estados finais, sem transição) |

Todo pedido novo nasce com status `recebido`. O identificador deve conter apenas dígitos
(`/pedidos/1.0` ou `/pedidos/1abc` resultam em 404).

## Rotas

| Método | Rota | Sucesso | Erros |
|---|---|---|---|
| POST | `/pedidos` | 201 | 400 dados inválidos |
| GET | `/pedidos` | 200 | — |
| GET | `/pedidos/:id` | 200 | 404 não encontrado |
| PATCH | `/pedidos/:id/status` | 200 | 400 status/transição inválidos, 404 id inexistente |

Erros têm sempre o formato `{ "erro": "mensagem" }`. Rotas inexistentes retornam 404 e
falhas inesperadas retornam 500 com mensagem genérica (sem detalhes internos).

### Exemplos

`POST /pedidos`
```json
{ "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal" }
```
Resposta `201`:
```json
{ "id": 1, "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal", "status": "recebido" }
```

`PATCH /pedidos/1/status` com `{ "status": "em_preparacao" }` -> `200` com o pedido atualizado.

`POST /pedidos` com `"cliente": "   "` -> `400`:
```json
{ "erro": "O cliente é obrigatório." }
```

## Arquitetura

Arquitetura em camadas, cada uma com uma responsabilidade:

```
src/
├── server.js                  # sobe o servidor (porta)
├── app.js                     # configura o Express, rotas e tratamento de erros
├── routes/pedidoRoutes.js     # mapeia método + URL para o controller
├── controllers/               # traduz HTTP <-> service (lê req, devolve status/JSON)
├── services/pedidoService.js  # regras de negócio, validações e armazenamento em memória
├── errors/                    # ErroValidacao (400) e ErroNaoEncontrado (404)
└── middlewares/               # decide o código HTTP a partir do tipo do erro
tests/
├── pedidoService.test.js      # testes das regras de negócio
└── api.test.js                # testes HTTP ponta a ponta
evidencias/                    # prints do Postman
```

**Fluxo de erros:** o service lança `ErroValidacao` ou `ErroNaoEncontrado`; o middleware
`tratadorDeErros` converte para 400 ou 404. Qualquer outro erro é tratado como inesperado
(500), para não ser confundido com erro de validação do usuário.

## Testes

`npm test` executa:
- testes do service (validações, fluxo e transições de status, ids inexistentes/malformados);
- testes HTTP (201, 400, 404, JSON malformado, body ausente, rota inexistente e 500).

## Evidências

Pasta `evidencias/` com capturas do Postman (método, URL, corpo, resposta e código HTTP):

| Arquivo | Cenário |
|---|---|
| `01-criacao.png` | POST válido -> 201 |
| `02-validacao.png` | POST inválido (cliente só com espaços) -> 400 |
| `03-listagem.png` | GET /pedidos -> 200 |
| `04-consulta-inexistente.png` | GET /pedidos/999 -> 404 |
| `05-atualizacao.png` | PATCH /pedidos/1/status válido -> 200 |

A coleção `postman/pedidos.postman_collection.json` pode ser importada no Postman para repetir todos os cenários
(a variável `baseUrl` aponta para `http://localhost:3000`). Para o print 05, o pedido precisa passar por
`em_preparacao` antes de `enviado`, conforme a tabela de transições.

## Uso de IA

**Utilizei IA?** Sim, o Claude (Anthropic), como apoio de revisão, correção e documentação.

**Para quais tarefas:**
- revisar a versão inicial do projeto contra o enunciado e listar o que estava errado ou faltando;
- corrigir o tratamento de erros, separar `app.js` e `server.js` e ajustar a validação de IDs;
- ampliar os testes automatizados (service e HTTP) e escrever o README;
- gerar a coleção do Postman para repetir os cenários.

Os testes (`npm test`) e as capturas do Postman foram executados por mim, na minha máquina.

**Sugestão aceita, com justificativa:** a IA apontou que o controller respondia 400 para qualquer erro
(`catch` genérico), inclusive falhas inesperadas, o que contraria o item 5 do enunciado (erros inesperados
não devem parecer validação do usuário). Aceitei a sugestão de criar as classes `ErroValidacao` e
`ErroNaoEncontrado` no service e um middleware `tratadorDeErros`, que retorna 400, 404 ou 500 conforme o tipo
do erro. Aceitei porque centraliza a decisão do código HTTP em um único lugar e mantém o controller simples.

const express = require('express');
const pedidoRoutes = require('./routes/pedidoRoutes');
const { rotaNaoEncontrada, tratadorDeErros } = require('./middlewares/tratadorDeErros');

const app = express();

app.use(express.json());
app.use('/pedidos', pedidoRoutes);
app.use(rotaNaoEncontrada);
app.use(tratadorDeErros);

module.exports = app;

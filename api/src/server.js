const http = require('http');
const express = require('express');
const helmet = require('helmet');

const service = express();
service.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

service.use(helmet());
service.get('/', (req, res) => {
  res.json({ ping: 'pong' });
});

module.exports = http.createServer(service);

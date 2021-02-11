const createError = require('http-errors');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const { isDevelopment } = require('envalid');

const service = express();
service.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

service.use(helmet());
service.get('/', (req, res) => {
  res.json({ ping: 'pong' });
});

// Force Express to throw an error on 404s.
service.use((req, res, next) => { // eslint-disable-line no-unused-vars
  throw createError(404, `No route found for '${req.path}'`);
});

// eslint-disable-next-line no-unused-vars
service.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const { message, stack } = err;
  const obj = { error: true, status, message };
  if (isDevelopment && stack) obj.stack = stack.split('\n');
  res.status(status).json(obj);
});

module.exports = http.createServer(service);

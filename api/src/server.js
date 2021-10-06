import createError from 'http-errors';
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import routes from './routes/index.js';

const isDevelopment = process.env.NODE_ENV === 'development';

const service = express();
service.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

service.use(helmet());
routes(service);

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

export default http.createServer(service);

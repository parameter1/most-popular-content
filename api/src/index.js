import newrelic from './newrelic.js'; // eslint-disable-line import/order
import bootService from '@parameter1/terminus/boot-service.js';
import terminusUtils from '@parameter1/terminus/utils.js';
import { filterUri } from '@parameter1/mongodb/utils.js';
import mongodb from './mongodb/client.js';
import server from './server.js';
import pkg from '../package.js';
import { HOST, PORT } from './env.js';

const { log } = terminusUtils;

process.on('unhandledRejection', (e) => {
  newrelic.noticeError(e);
  throw e;
});

bootService({
  name: pkg.name,
  version: pkg.version,
  server,
  host: HOST,
  port: PORT,
  onError: newrelic.noticeError.bind(newrelic),
  onStart: async () => mongodb.connect().then((client) => log(filterUri(client))),
  onSignal: () => mongodb.close(),
  onHealthCheck: () => mongodb.ping({ id: pkg.name }).then(() => 'db okay'),
}).catch((e) => setImmediate(() => {
  newrelic.noticeError(e);
  throw e;
}));

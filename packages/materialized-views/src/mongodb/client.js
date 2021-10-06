import { createMongoClient } from '@parameter1/events-repositories';
import { MONGO_URL } from '../env.js';
import pkg from '../../package.js';

export default createMongoClient({
  url: MONGO_URL,
  options: { appname: `${pkg.name} v${pkg.version}` },
});

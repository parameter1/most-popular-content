import MongoDBClient from '@parameter1/mongodb/client.js';
import { MONGO_URI } from '../env.js';
import pkg from '../../package.js';

export default new MongoDBClient({
  url: MONGO_URI,
  options: { appname: `${pkg.name} v${pkg.version}` },
});

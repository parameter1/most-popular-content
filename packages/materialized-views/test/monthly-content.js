import { filterMongoUri } from '@parameter1/events-repositories';
import mongodb from '../src/mongodb/client.js';
import generateContent from '../src/generate/content.js';

const immediatelyThrow = (e) => setImmediate(() => { throw e; });

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

(async () => {
  log('Connecting to MongoDB...');
  const conn = await mongodb.connect();
  log(`MongoDB connected to ${filterMongoUri(conn)}`);

  await generateContent({ granularity: 'month' });

  log('Closing MongoDB...');
  await mongodb.close();
  log('MongoDB closed.');
})().catch(immediatelyThrow);

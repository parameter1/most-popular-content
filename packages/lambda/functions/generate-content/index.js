import { generateContent, mongodbClient as mongodb, filterMongoUri } from '@most-popular-content/materialized-views';

const { log } = console;

export default ({ AWS_EXECUTION_ENV }) => async (_, context = {}) => {
  context.callbackWaitsForEmptyEventLoop = false;

  log('Connecting to MongoDB...');
  const conn = await mongodb.connect();
  log(`MongoDB connected to ${filterMongoUri(conn)}`);

  await Promise.all([
    generateContent({ granularity: 'week' }),
    generateContent({ granularity: 'month' }),
  ]);

  if (!AWS_EXECUTION_ENV) await mongodb.close();
};

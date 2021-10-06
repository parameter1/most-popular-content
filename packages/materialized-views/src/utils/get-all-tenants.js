import mongodb from '../mongodb/client.js';

const pattern = /^p1-events-([a-z0-9]+)$/;

export default async () => {
  const { databases } = await mongodb.listDatabases();
  return databases
    .filter(({ name }) => pattern.test(name))
    .map(({ name }) => {
      const matches = pattern.exec(name);
      return matches[1];
    }).sort();
};

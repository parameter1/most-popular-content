import createError from 'http-errors';
import mongodb from '../mongodb/client.js';
import asyncRoute from '../utils/async-route.js';

export default () => asyncRoute(async (req, res) => {
  const { query } = req;
  const { tenant, realm } = query;
  if (!tenant) throw createError(400, 'The tenant query param must be provided.');
  if (!realm) throw createError(400, 'The realm query param must be provided.');
  let limit = query.limit ? parseInt(query.limit, 10) : 10;
  if (!limit || limit < 1) limit = 10;
  if (limit > 50) limit = 50;

  const types = (query.types || '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v)
    .reduce((set, type) => {
      set.add(type);
      return set;
    }, new Set());

  const collection = await mongodb.collection({ dbName: 'most-popular', name: 'content' });
  const doc = await collection.findOne({
    granularity: 'week',
    tenant,
    realm,
  });
  if (!doc || !doc.data.length) return res.json({ data: [] });

  const filtered = types.size
    ? doc.data.filter(({ content }) => types.has(content.type))
    : doc.data;
  const data = filtered.slice(0, limit).map((row) => ({
    ...row,
    id: row.content._id, // add to prevent BC-breaks until package is updated
  }));
  return res.json({ data });
});

const createError = require('http-errors');
const { Repo } = require('@parameter1/mongodb/repo');
const client = require('../mongodb/client');
const asyncRoute = require('../utils/async-route');

module.exports = () => asyncRoute(async (req, res) => {
  const { query } = req;
  const { tenant, realm } = query;
  if (!tenant) throw createError(400, 'The tenant query param must be provided.');
  if (!realm) throw createError(400, 'The realm query param must be provided.');
  let limit = query.limit ? parseInt(query.limit, 10) : 10;
  if (!limit || limit < 1) limit = 10;
  if (limit > 50) limit = 50;

  const repo = new Repo({
    name: 'event',
    client,
    dbName: `p1-events-${tenant}`,
    collectionName: 'events',
  });

  const since = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

  const pipeline = [
    {
      $match: {
        date: { $gte: since },
        realm,
        act: 'View',
        cat: 'Content',
        env: 'production',
      },
    },
    { $project: { ent: 1, vis: 1 } },
    {
      $group: {
        _id: '$ent',
        vis: { $addToSet: '$vis' },
      },
    },
    { $unwind: '$vis' },
    {
      $group: {
        _id: '$_id',
        visitors: { $sum: 1 },
      },
    },
    { $sort: { visitors: -1 } },
    { $limit: limit },
  ];

  const cursor = await repo.aggregate({ pipeline });
  const results = await cursor.toArray();
  const data = results.map((row) => {
    const id = parseInt(/\d{8}$/.exec(row._id)[0], 10);
    return { id, vistiors: row.visitors };
  });
  res.json({ data });
});

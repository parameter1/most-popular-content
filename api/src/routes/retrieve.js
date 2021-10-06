import createError from 'http-errors';
import TenantRepositories from '@parameter1/events-repositories/repos/tenant';
import dayjs from 'dayjs';
import client from '../mongodb/client.js';
import asyncRoute from '../utils/async-route.js';

export default () => asyncRoute(async (req, res) => {
  const { query } = req;
  const { tenant, realm } = query;
  if (!tenant) throw createError(400, 'The tenant query param must be provided.');
  if (!realm) throw createError(400, 'The realm query param must be provided.');
  let limit = query.limit ? parseInt(query.limit, 10) : 10;
  if (!limit || limit < 1) limit = 10;
  if (limit > 50) limit = 50;

  const repos = new TenantRepositories({ client, slug: tenant });
  const now = dayjs();
  const start = now.subtract(1, 'week').startOf('day').toDate();
  const end = now.endOf('day').toDate();

  const pipeline = [
    {
      $match: {
        cat: 'Content',
        act: 'View',
        ent: /^base\./,
        realm,
        env: 'production',
      },
    },
    {
      $lookup: {
        from: 'events-by-hour',
        let: { eventHash: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_', '$$eventHash'] },
                  { $gte: ['$dt', start] },
                  { $lte: ['$dt', end] },
                ],
              },
            },
          },
          { $unwind: '$users' },
          { $group: { _id: '$users._', viewsPerUser: { $sum: 1 } } },
        ],
        as: 'users',
      },
    },
    { $unwind: '$users' },
    { $group: { _id: '$ent', users: { $sum: 1 }, views: { $sum: '$users.viewsPerUser' } } },
    { $sort: { users: -1 } },
    { $limit: limit },
  ];

  const cursor = await repos.eventObject.aggregate({ pipeline });
  const results = await cursor.toArray();
  const data = results.map((row) => {
    const id = parseInt(/\d{8}$/.exec(row._id)[0], 10);
    return { id, vistiors: row.users, views: row.views };
  });
  res.json({ data });
});

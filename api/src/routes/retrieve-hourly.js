import createError from 'http-errors';
import dayjs from 'dayjs';
// import { createHash } from 'crypto';
import mongodb from '../mongodb/client.js';
import asyncRoute from '../utils/async-route.js';

const granularities = new Set(['week', 'month']);

export default () => asyncRoute(async (req, res) => {
  const { query } = req;
  const { tenant, realm } = query;
  const granularity = query.granularity || 'week';
  if (!tenant) throw createError(400, 'The tenant query param must be provided.');
  if (!realm) throw createError(400, 'The realm query param must be provided.');
  if (!granularities.has(granularity)) throw createError(400, 'The provided granularity is not supported');
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

  const now = new Date();
  const start = dayjs(now).startOf('hour').subtract(1, granularity).toDate();
  const end = dayjs(now).startOf('hour').toDate();

  const collection = await mongodb.collection({ dbName: 'most-popular', name: 'content-hourly' });
  const $match = {
    hour: { $gte: start, $lte: end },
    realm,
    tenant,
    ...(types.size && { type: { $in: [...types] } }),
  };
  // const hash = createHash('sha1').update(JSON.stringify($match)).digest('hex');
  const pipeline = [
    { $match },
    {
      $project: {
        contentId: 1,
        type: 1,
        users: 1,
        views: 1,
        updatedAt: 1,
      },
    },
    {
      $group: {
        _id: '$contentId',
        type: { $first: '$type' },
        users: { $sum: '$users' },
        views: { $sum: '$views' },
        updatedAt: { $max: '$updatedAt' },
      },
    },
    { $sort: { users: -1 } },
    { $limit: limit },
    {
      $project: {
        users: '$users',
        uniqueUsers: '$users', // deprecated
        views: '$views',
        content: {
          _id: '$_id',
          type: '$type',
        },
        id: '$_id', // deprecated
        updatedAt: '$updatedAt',
      },
    },
    {
      $group: {
        _id: null,
        updatedAt: { $max: '$updatedAt' },
        data: { $push: '$$ROOT' },
      },
    },
    {
      $project: {
        _id: 0,
        granularity: { $literal: granularity },
        tenant: { $literal: tenant },
        realm: { $literal: realm },
        startsAt: { $literal: start },
        endsAt: { $literal: end },
        updatedAt: '$updatedAt',
        data: '$data',
      },
    },
  ];
  const cursor = await collection.aggregate(pipeline);
  const [doc] = await cursor.toArray();
  res.json({
    granularity,
    tenant,
    realm,
    startsAt: start,
    endsAt: end,
    ...(doc && { updatedAt: doc.updatedAt }),
    data: doc ? doc.data : [],
  });
});

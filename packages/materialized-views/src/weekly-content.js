import dayjs from 'dayjs';
import eachSeries from 'async/eachSeries.js';
import getAllTenants from './utils/get-all-tenants.js';
import createRepos from './mongodb/create-repos.js';

const getRealms = async (repos) => {
  const values = await repos.eventObject.distinct({ key: 'realm' });
  return values.filter((v) => v).map((v) => v.trim()).filter((v) => v);
};

const { log } = console;

export default async () => {
  const tenants = await getAllTenants();

  const now = dayjs();
  const start = now.subtract(1, 'week').startOf('day').toDate();
  const end = now.endOf('day').toDate();

  await eachSeries(tenants, async (slug) => {
    log(`Updating weekly content data for ${slug}...`);
    const repos = createRepos(slug);
    const realms = await getRealms(repos);
    log(`Found ${realms.length} realms to update.`);

    await Promise.all(realms.map(async (realm) => {
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
        { $group: { _id: '$ent', uniqueUsers: { $sum: 1 }, views: { $sum: '$users.viewsPerUser' } } },
        { $sort: { uniqueUsers: -1 } },
        { $limit: 50 },
        { $addFields: { entityParts: { $split: ['$_id', '*'] } } },
        {
          $addFields: {
            ns: { $arrayElemAt: ['$entityParts', 0] },
            contentId: { $toInt: { $arrayElemAt: ['$entityParts', 1] } },
          },
        },
        {
          $project: {
            content: {
              _id: '$contentId',
              type: {
                $replaceOne: {
                  input: { $arrayElemAt: [{ $split: ['$ns', '.'] }, 2] },
                  find: 'content-',
                  replacement: '',
                },
              },
            },
            uniqueUsers: 1,
            views: 1,
          },
        },
        {
          $group: {
            _id: null,
            data: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            granularity: { $literal: 'week' },
            tenant: { $literal: slug },
            realm: { $literal: realm },
            data: 1,
            updatedAt: { $literal: now.toDate() },
          },
        },
        {
          $merge: {
            into: { db: 'most-popular', coll: 'content' },
            on: ['realm', 'tenant', 'granularity'],
            whenMatched: 'replace',
            whenNotMatched: 'insert',
          },
        },
      ];
      const cursor = await repos.eventObject.aggregate({ pipeline });
      await cursor.toArray();
      log(` - Site ID '${realm}' updated.`);
    }));
    log(`Data updated for ${slug}.\n`);
  });
};

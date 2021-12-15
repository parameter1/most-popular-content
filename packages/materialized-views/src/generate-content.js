import dayjs from 'dayjs';
import eachSeries from 'async/eachSeries.js';
import getAllTenants from './utils/get-all-tenants.js';
import createRepos from './mongodb/create-repos.js';

const getRealms = async (repos) => {
  const values = await repos.eventObject.distinct({ key: 'realm' });
  return values.filter((v) => v).map((v) => v.trim()).filter((v) => v);
};

const { log } = console;

export default async ({ granularity }) => {
  const tenants = await getAllTenants();

  const now = dayjs();
  const limit = 250;
  const start = now.subtract(1, granularity).startOf('day').toDate();
  const end = now.endOf('day').toDate();

  await eachSeries(tenants, async (slug) => {
    log(`Updating content data for ${slug} by ${granularity}...`);
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
        { $limit: limit },
        { $group: { _id: null, data: { $push: '$$ROOT' } } },
        {
          $project: {
            _id: 0,
            granularity: { $literal: granularity },
            tenant: { $literal: slug },
            realm: { $literal: realm },
            data: 1,
            startsAt: { $literal: start },
            endsAt: { $literal: end },
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

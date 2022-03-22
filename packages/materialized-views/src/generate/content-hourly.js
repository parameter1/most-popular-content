import dayjs from 'dayjs';
import eachSeries from 'async/eachSeries.js';
import getAllTenants from '../utils/get-all-tenants.js';
import getRealms from '../utils/get-realms.js';
import createRepos from '../mongodb/create-repos.js';
import mongodb from '../mongodb/client.js';

const { log } = console;

export default async ({ hourDrift = 1 } = {}) => {
  const tenants = await getAllTenants();

  await eachSeries(tenants, async (slug) => {
    log(`Updating hourly content data for ${slug}...`);
    const repos = createRepos(slug);
    const realms = await getRealms(repos);
    log(`Found ${realms.length} realms to update.`);

    await eachSeries(realms, async (realm) => {
      const lastSyncDate = await (async () => {
        const collection = await mongodb.collection({ dbName: 'most-popular', name: 'content-hourly' });
        const doc = await collection.findOne({ realm }, {
          sort: { updatedAt: -1 },
          projection: { updatedAt: 1 },
        });
        const date = doc ? dayjs(doc.updatedAt).subtract(hourDrift, 'hour').toDate() : dayjs().subtract(1, 'month').startOf('day').toDate();
        return dayjs(date).startOf('hour').toDate();
      })();
      log(` - Updating Site ID '${realm}' since ${lastSyncDate.toISOString()}...`);

      const now = new Date();
      const pipeline = [
        {
          $match: {
            ent: new RegExp(`^base\\.${slug}-.+\\.content-.+\\*\\d{8}$`),
            cat: 'Content',
            act: 'View',
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
                      { $gte: ['$dt', lastSyncDate] },
                      { $lte: ['$dt', now] },
                    ],
                  },
                },
              },
              { $unwind: '$users' },
              { $group: { _id: { uid: '$users._', hour: '$dt' }, viewsPerUser: { $sum: 1 } } },
            ],
            as: 'events',
          },
        },
        { $unwind: '$events' },
        { $group: { _id: { entity: '$ent', hour: '$events._id.hour' }, users: { $sum: 1 }, views: { $sum: '$events.viewsPerUser' } } },
        {
          $project: {
            _id: 0,
            contentId: { $toInt: { $arrayElemAt: [{ $split: ['$_id.entity', '*'] }, 1] } },
            hour: '$_id.hour',
            realm: { $literal: realm },
            tenant: { $literal: slug },
            type: {
              $arrayElemAt: [{ $split: [{ $arrayElemAt: [{ $split: [{ $arrayElemAt: [{ $split: ['$_id.entity', '*'] }, 0] }, '.'] }, 2] }, '-'] }, 1],
            },
            updatedAt: now,
            users: '$users',
            views: '$views',
          },
        },
        {
          $merge: {
            into: { db: 'most-popular', coll: 'content-hourly' },
            on: ['hour', 'realm', 'tenant', 'contentId'],
            whenMatched: 'replace',
            whenNotMatched: 'insert',
          },
        },
      ];
      const cursor = await repos.eventObject.aggregate({ pipeline });
      await cursor.toArray();
      log(` - Site ID '${realm}' updated.`);
    });
    log(`Data updated for ${slug}.\n`);
  });
};

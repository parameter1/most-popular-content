const { handler } = require('../handlers/monthly-content.js');

handler().catch((e) => setImmediate(() => { throw e; }));

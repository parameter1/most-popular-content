const { handler } = require('../handlers/weekly-content.js');

handler().catch((e) => setImmediate(() => { throw e; }));

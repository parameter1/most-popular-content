const { handler } = require('../handlers/generate-content.js');

handler().catch((e) => setImmediate(() => { throw e; }));

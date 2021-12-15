const loadFn = require('./_load.js');

exports.handler = (...args) => loadFn('../functions/monthly-content/index.js', ...args);

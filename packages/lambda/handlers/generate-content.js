const loadFn = require('./_load.js');

exports.handler = (...args) => loadFn('../functions/generate-content/index.js', ...args);

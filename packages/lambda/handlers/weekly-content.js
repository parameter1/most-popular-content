const loadFn = require('./_load.js');

exports.handler = (...args) => loadFn('../functions/weekly-content/index.js', ...args);

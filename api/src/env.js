const {
  port,
  cleanEnv,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  MONGO_URI: str({ desc: 'The BaseCMS MongoDB instance to connect to.' }),
  PORT: port({ desc: 'The port that the service will run on.', default: 80 }),
});

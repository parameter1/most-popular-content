import {
  bool,
  port,
  cleanEnv,
  str,
} from 'envalid';

export const {
  HOST,
  MONGO_URI,
  NEW_RELIC_ENABLED,
  NEW_RELIC_LICENSE_KEY,
  PORT,
} = cleanEnv(process.env, {
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  MONGO_URI: str({ desc: 'The P1 Events MongoDB instance to connect to.' }),
  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: true, devDefault: false }),
  NEW_RELIC_LICENSE_KEY: str({ desc: 'The license key for New Relic.', devDefault: '(unset)' }),
  PORT: port({ desc: 'The port that the service will run on.', default: 80 }),
});

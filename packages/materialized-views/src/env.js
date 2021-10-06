import {
  cleanEnv,
  str,
} from 'envalid';

// eslint-disable-next-line import/prefer-default-export
export const {
  MONGO_URL,
} = cleanEnv(process.env, {
  MONGO_URL: str({ desc: 'The P1 Events MongoDB instance to connect to.' }),
});

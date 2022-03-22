import Redis from 'ioredis';
import { REDIS_DSN } from './env.js';

export default new Redis(REDIS_DSN);

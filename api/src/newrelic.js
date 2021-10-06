import newrelic from 'newrelic';
import { NEW_RELIC_ENABLED } from './env.js';

process.env.NEW_RELIC_ENABLED = NEW_RELIC_ENABLED;

export default newrelic;

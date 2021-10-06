import TenantRepositories from '@parameter1/events-repositories/repos/tenant';
import client from './client.js';

export default (slug) => new TenantRepositories({ client, slug });

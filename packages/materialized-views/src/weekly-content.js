import getAllTenants from './utils/get-all-tenants.js';

export default async () => {
  const tenants = await getAllTenants();
  console.log({ tenants });
};

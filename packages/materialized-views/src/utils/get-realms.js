export default async (eventTenantRepos) => {
  const values = await eventTenantRepos.eventObject.distinct({
    key: 'realm',
    query: { realm: /^[a-f0-9]{24}$/ },
  });
  return values.filter((v) => v).map((v) => v.trim()).filter((v) => v);
};

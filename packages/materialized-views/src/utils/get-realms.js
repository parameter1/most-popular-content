export default async (repos) => {
  const values = await repos.eventObject.distinct({ key: 'realm' });
  return values.filter((v) => v).map((v) => v.trim()).filter((v) => v);
};

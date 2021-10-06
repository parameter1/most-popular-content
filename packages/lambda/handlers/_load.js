const { log } = console;
const immediatelyThrow = (e) => setImmediate(() => { throw e; });

process.on('unhandledRejection', immediatelyThrow);

const { AWS_EXECUTION_ENV } = process.env;

module.exports = async (path, ...args) => {
  const { default: fn } = await import(path);
  await fn({ AWS_EXECUTION_ENV })(...args);
  log('DONE!');
};

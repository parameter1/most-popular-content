const retrieve = require('./retrieve');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.json({ ping: 'pong' });
  });

  app.get('/retrieve', retrieve());
};

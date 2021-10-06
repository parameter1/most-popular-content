import retrieve from './retrieve.js';

export default (app) => {
  app.get('/', (req, res) => {
    res.json({ ping: 'pong' });
  });

  app.get('/retrieve', retrieve());
};

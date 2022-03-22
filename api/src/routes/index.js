import retrieve from './retrieve.js';
import retrieveHourly from './retrieve-hourly.js';

export default (app) => {
  app.get('/', (req, res) => {
    res.json({ ping: 'pong' });
  });

  app.get('/retrieve', retrieve());
  app.get('/retrieve-hourly', retrieveHourly());
};

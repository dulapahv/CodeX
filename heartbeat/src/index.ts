import express from 'express';

import { heartbeatController } from './controllers/heartbeat';

const app = express();

// Basic error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Server Error:', err);
    res.status(500).send('Internal Server Error');
  }
);

app.use('/heartbeat', heartbeatController);

app.listen(3002, () => {
  console.log('Kasca-heartbeat is running on port 3002');
});

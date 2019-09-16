import express from 'express'
import devicesRouter from './routes/devices/index'
import apiconf from './misc/apiconf'
import logger from './misc/logger'

const API_ROOT = `/api/${apiconf.version}`;
const PORT = 8000;

const server = express();

server.use(express.static('public'));
server.use(express.json());
server.use(API_ROOT, devicesRouter);

server.listen(PORT, () => logger.info(`Server listening on port ${PORT}.`));
import express from 'express'
import devicesRouter from './routes/devices/index'
import usersRouter from './routes/users/index'
import logger from './misc/logger'

const API_VERSION = process.env.SEET_API_VERSION || '1.0.0';
const API_ROOT = `/api/${API_VERSION}`;
const PORT = process.env.SEET_API_PORT || 80;

const server = express();

server.use(express.static('public'));
server.use(express.json());
server.use(API_ROOT, devicesRouter);
server.use(API_ROOT, usersRouter);

server.listen(PORT, () => logger.info(`Server listening on port ${PORT}.`));
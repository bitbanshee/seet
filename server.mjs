import express from 'express'
import device_auth from './routes/auth/device_api_token_verifier'
import device from './routes/device'
import apiconf from './misc/apiconf'
import logger from './misc/logger'

const API_ROOT = `/api/${apiconf.version}`;
const PORT = 80;

const server = express();

server.use(express.static('public'));
server.use(express.json());
server.use(`${API_ROOT}/device`, device_auth, device);

server.listen(PORT, () => logger.info(`Server listening on port ${PORT}.`));
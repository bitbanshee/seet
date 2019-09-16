import query from '../../db/index'
import jwt from 'jsonwebtoken'
import { readFile } from 'fs'
import Router from 'express-promise-router'
import logger from '../../misc/logger'

const router = new Router();

router.use('/:deviceId', async (req, res) => {
  log.info(`Received token verification request`, { sender: req.ip });
  try {
    await verifyTokenHandler(req, res);
  } catch (e) {
    log.error(`Can't verify token`, { error: e, sender: req.ip });
    res.status(500).send(`Can't verify token`);
  }
});

export default router;

async function verifyTokenHandler (req, res) {
  if (!validateHeaders(req.headers)) {
    log.error(`Authorization header not provided or invalid`, { sender: req.ip });
    res
      .status(401)
      .set('WWW-Authenticate', 'Bearer realm="Send device telemetry"')
      .send(`Authorization header not provided or invalid`);
    return;
  }

  const token = req.headers['authorization'].substring('Bearer '.length);
  try {
    await decryptToken(token);
  } catch (e) {
    logger.error(`Can't decrypt token`, { error: e, sender: req.ip })
    res.status(403).send(`Invalid token`);
    return;
  }

  const deviceId = req.params['deviceId'];
  const { rows: tokens } = await query(
    `SELECT * FROM device.access_tokens WHERE device = '${deviceId}' AND token = '${token}' AND expiration_time <= current_timestamp();`);

  if (tokens.length == 0) {
    logger.error(`Can't find a valid token in the database for device ${deviceId}`, { sender: req.ip })
    res.status(403).send(`Invalid token`);
    return;
  }

  logger.info(`Token validated`, { sender: req.ip });
  return Promise.resolve('next');
};

async function decryptToken (token) {
  return new Promise((res, rej) => {
    readFile('../sensitive/key.pub', (err, key) => {
      if (err) {
        rej(err);
      }
      res(key);
    })
  })
    .then(pubKey => {
      return new Promise((res, rej) => {
        jwt.verify(token, pubKey, {
          algorithms: ['RS256'],
        }, function (err, payload) {
          if (err) {
            rej(err);
          }
          
          res(payload);
        });
      });
    });
}

function validateHeaders (headers) {
  return headers['authorization'] != ''
    && headers['authorization'] != undefined
    && headers['authorization'].startsWith('Bearer')
}
import query from '../../db/index.mjs'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import bcrypt from 'bcrypt'
import Router from 'express-promise-router'
import logger from '../../misc/logger.mjs'

const router = new Router();

router.get('/auth/:deviceId', async (req, res) => {
  logger.info(`Received device auth request`, { sender: req.ip });
  try {
    await authHandler(req, res);
  } catch (e) {
    logger.error(`Can't verify token`, { error: e, sender: req.ip });
    res.status(500).send(`Can't verify token`);
  }
});

export default router;

async function authHandler (req, res) {
  if (!validateHeaders(req.headers)) {
    logger.error(`Authorization header not provided or invalid`, { sender: req.ip });
    res
      .status(401)
      .set('WWW-Authenticate', 'Bearer realm="Send device token"')
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
    `SELECT * FROM device.access_tokens WHERE device = '${deviceId}' AND expiration_time <= current_timestamp`);

  if (tokens.length == 0) {
    logger.error(`Can't find a valid token in the database for device ${deviceId}`, { sender: req.ip })
    res.status(403).send(`Invalid token`);
    return;
  }

  const validRecord = tokens[0];
  if (! await bcrypt.compare(token, validRecord.token)) {
    logger.info(`Invalid token for user ${user}`, { sender: req.ip });
    res.status(403).send(`Invalid token`);
    return;  
  }

  logger.info(`Token validated`, { sender: req.ip });
  res.status(200).send();
};

async function decryptToken (token) {
  return new Promise((res, rej) => {
    fs.readFile('sensitive/key.pub', { encoding: 'utf8' }, (err, key) => {
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
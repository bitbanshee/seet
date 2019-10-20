import query from '../../db/index.mjs'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import bcrypt from 'bcrypt'
import Router from 'express-promise-router'
import logger from '../../misc/logger.mjs'

// 30 days
const expirationTime = (Date.now() / 1000) + (30 * 24 * 60 * 60);
const router = new Router();

router.post('/join', async (req, res) => {
  logger.info(`Received device join request`, { sender: req.ip });

  try {
    const authRequest = request(`/users/auth`);
    req.pipe(authRequest);
    await authRequest;
  } catch (e) {
    logger.error(`Error authenticating user`, { error: e, sender: req.ip });
    res.status(403).send(`Invalid user or password or user has no privileges to sign up a device`);
    return;
  }

  try {
    await joinHandler(req, res);
  } catch (e) {
    logger.error(`Error signing up device`, { error: e, sender: req.ip });
    res.status(500).send(`Error signing up device`);
  }
});

export default router;

async function joinHandler(req, res) {
  const { name, imei, sim } = req.body;
  const maybeDeviceId = await checkDevice(imei, sim);
  if (maybeDeviceId !== null) {
    logger.info(`Device already exists with id ${maybeDeviceId}`, { sender: req.ip })
  }

  const deviceId = maybeDeviceId !== null
    ? maybeDeviceId
    : await createDevice(name, imei, sim);

  if (deviceId === null) {
    logger.info(`Can't create device with imei ${imei} and sim number ${sim}`, { sender: req.ip })
    res.status(500).send(`Can't create device`);
    return;
  }
  
  const { expirationTime, token } = await signToken(deviceId, imei, sim);
  const hashedToken = await bcrypt.hash(token, 10 + ~~(Math.random() * 8));
  const { rows: tokenRecords } = await query(
    `INSERT INTO devices.access_tokens (device, token, expiration_time) VALUES ($1, $2, $3)`,
    [deviceId, hashedToken, expirationTime]);

  if (tokenRecords.length == 0) {
    logger.info(`Can't create token for device ${deviceId}`, { sender: req.ip })
    res.status(500).send(`Can't create token for device`);
    return;
  }

  res
    .status(201)
    .send({ token, device_id: deviceId });
}

async function signToken(deviceId, imei, sim_number) {
  return await Promise.all([
    new Promise((res, rej) => {
      fs.readFile('sensitive/key', (err, key) => {
        if (err) {
          logger.error(`Error reading key: ${err.stack}`);
          rej(err);
        }
        res(key);
      })
    }),
    new Promise((res, rej) => {
      fs.readFile('sensitive/pass', { encoding: 'utf8' }, (err, key) => {
        if (err) {
          logger.error(`Error reading pass: ${err.stack}`);
          rej(err);
        }
        res(key);
      })
    }),
  ])
    .then(([key, passphrase]) => {
      return new Promise((res, rej) => {
        jwt.sign({
          data: {
            deviceId,
            imei,
            sim_number
          },
          exp: expirationTime
        }, {
          key,
          passphrase
        }, {
          algorithm: 'RS256',
          expiresIn: aMonth
        }, function (err, token) {
          if (err) {
            logger.error(`Error signing token: ${err.message}`)
            rej(err);
          }
          res({ expirationTime, token });
        });
      });
    });
}

async function checkDevice(imei, sim) {
  const { rows } = await query(
    `SELECT * FROM device.devices WHERE imei = '${imei}' AND sim_number = '${sim}'`);
  if (rows.length > 0) {
    return rows[0].id;
  }
  return null;
}

async function createDevice(name, imei, sim) {
  const { rows } = await query(
    `INSERT INTO device.devices (name, sim_number, imei, active) VALUES ($1, $2, $3, $4)`,
    [name, sim, imei, false]);
  if (rows.length > 0) {
    return rows[0].id;
  }
  return null;
}
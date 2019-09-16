import query from '../../db/index'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import Router from 'express-promise-router'
import logger from '../../misc/logger'

// 30 days
const expirationTime = (Date.now() / 1000) + (30 * 24 * 60 * 60);
const router = new Router();

router.post('/join', async (req, res) => {
  logger.info(`Received device join request`, { sender: req.ip });
  try {
    await joinHandler(req, res);
  } catch (e) {
    logger.error(`Error signing up device`, { error: e, sender: req.ip });
    res.status(500).send(`Error signing up device`);
  }
});

export default router;

async function joinHandler(req, res) {
  if (!validateHeaders(req.headers)) {
    logger.error(`Authorization header not provided or invalid`, { sender: req.ip });
    res
      .status(401)
      .set('WWW-Authenticate', 'Basic realm="Generate access token for device"')
      .send(`Authorization header not provided or invalid`);
    return;
  }

  const [ user, password ] = atob(req.headers['authorization'].substring('Basic '.length)).split(':');
  if (! await validateUser(user, password)) {
    res.status(403).send(`Invalid user or password`);
    return;
  }

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
  const { tokens } = await query(
    `INSERT INTO devices.access_tokens (device, token, expiration_time) VALUES ($1, $2, $3)`,
    [deviceId, token, expirationTime]);

  if (tokens.length == 0) {
    logger.info(`Can't create token for device ${deviceId}`, { sender: req.ip })
    res.status(500).send(`Can't create token for device`);
    return;
  }

  res
    .status(201)
    .send({ token, device_id: deviceId });
}

function validateHeaders (headers) {
  return headers['authorization'] != ''
    && headers['authorization'] != undefined
    && headers['authorization'].startsWith('Basic')
}

async function validateUser(user, password) {
  const { rows: validUsers } = await query(
    `SELECT * FROM public.users WHERE email = '${user}' AND password = '${password}' AND role = 'admin'`);

  if (validUsers.length > 0) {
    return true;
  }

  const { rows: users } = await query(
    `SELECT * FROM public.users WHERE email = '${user}'`);

  if (users.length == 0) {
    logger.info(`No user ${user}`, { sender: req.ip });
    return false;
  }

  const { rows: adminUsers } = await query(
    `SELECT * FROM public.users WHERE email = '${user}' AND role = 'admin'`);

  if (adminUsers.length == 0) {
    logger.info(`User ${user} has no right to create devices`, { sender: req.ip });
    return false;
  }

  logger.info(`Invalid password for user ${user}`, { sender: req.ip });
  return false;
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
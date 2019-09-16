import query from '../db/index'
import Router from 'express-promise-router'
import logger from '../misc/logger'

const INSERT_QUERY = `INSERT INTO device.history VALUES ($1, $2, $3, $4, $5, $6, $7)`;

const router = new Router();

router.post('/:deviceId/history', async (req, res) => {
  log.info(`Received device request`, { sender: req.ip });
  try {
    await handler(req, res);
  } catch (e) {
    log.error(`Can't store device information`, { sender: req.ip });
    res.status(500).send(`Can't store device information`);
  }
});

export default router;

async function handler(req, res) {
  if (req.body == undefined || req.body == '') {
    log.error(`No body`, { sender: req.ip });
    res.status(400).send(`No body sent`);
    return;
  }

  const deviceInfo = req.body;
  const deviceId = req.params['deviceId'];
  const { rows } = await query(INSERT_QUERY, [
    deviceId,
    `(${deviceInfo.latitude},${deviceInfo.longitude})`,
    deviceInfo.altitude,
    deviceInfo.precision,
    deviceInfo.age,
    deviceInfo.speed,
    new Date(deviceInfo.sent),
    Date.now()
  ]);

  if (rows.length == 0) {
    log.error(`Error storing device information from device ${deviceId}`, { sender: req.ip });
    res.status(500).send(`Error storing device information`);
    return;
  }

  logger.info(`Information from device ${deviceId} sent ${new Date(deviceInfo.sent)} stored`, { sender: req.ip });
  res.status(201).send();
}

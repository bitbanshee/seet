import query from '../../db/index'
import Router from 'express-promise-router'
import logger from '../../misc/logger'
import request from 'request-promise-native'

const router = new Router();

router.use('/history/:deviceId', async (req, res) => {
  // TODO: check if this is necessary
  logger.info(`Received device request`, { sender: req.ip });
  const deviceId = req.params['deviceId'];
  if (deviceId === undefined || deviceId == '') {
    logger.info(`No device ID provided`, { sender: req.ip });
    res.status(400).send(`No device ID provided`);
    return;
  }

  /**
   * TODO: check alternative
   * const authRequest = request(`/devices/auth/${deviceId}`);
   * req.pipe(authRequest);
   * authRequest
   *   .then(() => Promise.resolve('next'))
   *   .catch(reason => reason.response.pipe(res))
   */

  return await request({
    url: `/devices/auth/${deviceId}`,
    headers: req.headers
  })
    .then(() => Promise.resolve('next'))
    .catch(reason => reason.response.pipe(res))
});

router.get('/history/:deviceId', async (req, res) => {
  logger.info(`It's a device GET request`, { sender: req.ip });
  try {
    await getHandler(req, res);
  } catch (e) {
    logger.error(`Can't get device history`, { sender: req.ip });
    res.status(500).send(`Can't get device history`);
  }
});

router.post('/history/:deviceId', async (req, res) => {
  logger.info(`It's a device POST request`, { sender: req.ip });
  try {
    await postHandler(req, res);
  } catch (e) {
    logger.error(`Can't store device history`, { sender: req.ip });
    res.status(500).send(`Can't store device history`);
  }
});

export default router;

async function getHandler(req, res) {
  const deviceId = req.params['deviceId'];
  const filterClauses = extractFilters(req.query)
    .map(filter => filter.makeFilter())
    .join(` AND `);

  const queryText = `
SELECT
  coordinates,
  altitude_cm,
  precision,
  age,
  speed,
  sent_time,
  received_time
FROM device.history
WHERE device = $1${filterClauses !== '' ? ` AND ${filterClauses}` : ''}`;

  const { rows } = await query(queryText, [deviceId]);
  if (rows.length == 0) {
    logger.info(`No history for device ${deviceId}`, { sender: req.ip });
  } else {
    logger.info(`History for ${deviceId} found`, { sender: req.ip });
  }

  res.status(200).send(rows);
}

async function postHandler(req, res) {
  if (req.body == undefined || req.body == '') {
    logger.error(`Empty request body`, { sender: req.ip });
    res.status(400).send(`Empty request body`);
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
    logger.error(`Error storing device information from device ${deviceId}`, { sender: req.ip });
    res.status(500).send(`Error storing device information`);
    return;
  }

  logger.info(`Information from device ${deviceId} sent ${new Date(deviceInfo.sent)} stored`, { sender: req.ip });
  res.status(201).send();
}

function extractFilters(query) {
  const {
    sentTime,
    minSentTime,
    maxSentTime,
    receivedTime,
    minReceivedTime,
    maxReceivedTime,
    precision,
    minPrecision,
    maxPrecision,
    age,
    minAge,
    maxAge,
  } = query;

  const queryFilterTuples = [
    [
      `sent_time`,
      sentTime,
      minSentTime,
      maxSentTime
    ],
    [
      `received_time`,
      receivedTime,
      minReceivedTime,
      maxReceivedTime
    ],
    [
      `precision`,
      precision,
      minPrecision,
      maxPrecision
    ],
    [
      `age`,
      age,
      minAge,
      maxAge
    ]
  ];

  return queryFilterTuples
    .map(tuple => numericSQLFilterFactory(...tuple))
    .filter(tuple => tuple !== null);
}

function numericSQLFilterFactory(identifier, equal, min, max) {
  if (isValidNumber(equal)) {
    return {
      getFilter() {
        return `${identifier} = ${equal}`
      }
    };
  }

  const filters = [];
  if (isValidNumber(min)) {
    filter.push(`>= ${min}`);
  }

  if (isValidNumber(max)) {
    filter.push(`< ${max}`);
  }

  if (filter.length == 0) {
    return null;
  }

  return {
    getFilter() {
      return filters
        .map(filter => `${identifier} ${filter}`)
        .join(` AND `);
    }
  };
}

function isValidNumber(num) {
  return num !== null
    && num !== undefined
    && !Number.isNaN(Number.parseFloat(num));
}
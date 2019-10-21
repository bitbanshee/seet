import query from '../../db/index.mjs'
import Router from 'express-promise-router'
import logger from '../../misc/logger.mjs'
import request from 'request-promise-native'
import { API_ROOT, API_PORT } from '../../../server.mjs'

const router = new Router();

router.use('/history/:deviceId', async (req, res) => {
  const deviceId = req.params['deviceId'];
  const token = req.headers['authorization'].substring('Bearer '.length);
  try {
    await request({
      url: `http://localhost:${API_PORT}${API_ROOT}/devices/auth/${deviceId}`,
      auth: {
        'bearer': token 
      }
    });
    return 'next';
  } catch (reason) {
    reason.response.pipe(res);
  }
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
    .map(filter => filter.getFilter())
    .join(` AND `);

  const queryText = `
SELECT
  device,
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
  const queryText = `INSERT INTO device.history (device, coordinates, altitude_cm, precision, age, ` +
    `speed, sent_time, received_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
  const { rows } = await query(queryText, [
    deviceId,
    deviceInfo.coordinates,
    deviceInfo.altitude_cm,
    deviceInfo.precision,
    deviceInfo.age,
    deviceInfo.speed,
    new Date(parseInt(deviceInfo.sent_time)),
    new Date()
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

  const queryFilters = [
    {
      identifier: `sent_time`,
      equal: sentTime,
      min: minSentTime,
      max: maxSentTime,
      validation: timeValidation,
      transformation: timeTransformation
    },
    {
      identifier: `received_time`,
      equal: receivedTime,
      min: minReceivedTime,
      max: maxReceivedTime,
      validation: timeValidation,
      transformation: timeTransformation
    },
    {
      identifier: `precision`,
      equal: precision,
      min: minPrecision,
      max: maxPrecision,
      validation: isValidNumber
    },
    {
      identifier: `age`,
      equal: age,
      min: minAge,
      max: maxAge,
      validation: isValidNumber
    }
  ];

  return queryFilters
    .map(filter => numericSQLFilterFactory(filter))
    .filter(sqlFilter => sqlFilter !== null);
}

function numericSQLFilterFactory(filter) {
  const {
    identifier,
    equal,
    min,
    max,
    validation = () => true,
    transformation = a => a
  } = filter;
  
  if (validation(equal)) {
    return {
      getFilter() {
        return `${identifier} = ${transformation(equal)}`
      }
    };
  }

  const filters = [];
  if (validation(min)) {
    filters.push(`>= ${transformation(min)}`);
  }

  if (validation(max)) {
    filters.push(`< ${transformation(max)}`);
  }

  if (filters.length == 0) {
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

function timeValidation(time) {
  return time !== null
    && time !== undefined
    && time.length == 14
    && /^\d+$/.test(time);
}

function timeTransformation(time) {
  const year   = s.substring(0, 4),
        month  = s.substring(4, 6),
        day    = s.substring(6, 8),
        hour   = s.substring(8, 10),
        minute = s.substring(10, 12),
        second = s.substring(12, 14);

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
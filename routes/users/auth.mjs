import query from '../../db/index'
import Router from 'express-promise-router'
import logger from '../../misc/logger'
import bcrypt from 'bcrypt'

const router = new Router();

router.get('/auth', async (req, res) => {
  logger.info(`Received user auth request`, { sender: req.ip });
  try {
    await authHandler(req, res);
  } catch (e) {
    logger.error(`Can't verify user`, { error: e, sender: req.ip });
    res.status(500).send(`Can't verify user`);
  }
});

export default router;

async function authHandler (req, res) {
  if (!validateHeaders(req.headers)) {
    logger.error(`Authorization header not provided or invalid`, { sender: req.ip });
    res
      .status(401)
      .set('WWW-Authenticate', 'Basic realm="Authentication"')
      .send(`Authorization header not provided or invalid`);
    return;
  }

  const [ user, password ] = atob(req.headers['authorization'].substring('Basic '.length)).split(':');
  const role = req.query.role || null;
  const validUser = await fetchUser(user, password, role);
  if (validUser === null) {
    res.status(403).send(`Invalid user or password or user has no provided role`);
    return;
  }

  res.status(200).send();
};

function validateHeaders (headers) {
  return headers['authorization'] != ''
    && headers['authorization'] != undefined
    && headers['authorization'].startsWith('Basic')
}

async function fetchUser(user, password, role) {
  const { rows: validUsers } = await query(
    `SELECT name, email, password, role FROM public.users WHERE email = '${user}'`);

  if (validUsers.length == 0) {
    logger.info(`No user ${user}`, { sender: req.ip });
    return null;
  }
  
  const validUser = validUsers[0];
  if (role !== null && validUser.role !== role)  {
    logger.info(`User ${user} has no role ${role}`, { sender: req.ip });
    return null;
  }

  if (! await bcrypt.compare(password, validUser.password)) {
    logger.info(`Invalid password for user ${user}`, { sender: req.ip });
    return null;
  }

  // It's dangerous out there
  return Object.assign({}, validUser, { password: undefined });
}
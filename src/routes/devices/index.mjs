import Router from 'express-promise-router'
import historyRouter from './history.mjs'
import authRouter from './auth.mjs'
import joinRouter from './join.mjs'

const router = new Router();
router.use(`/devices`, historyRouter);
router.use(`/devices`, authRouter);
router.use(`/devices`, joinRouter);

export default router;
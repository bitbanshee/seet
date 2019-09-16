import Router from 'express-promise-router'
import historyRouter from './history'
import authRouter from './auth'
import joinRouter from './join'

const router = new Router();
router.use(`/devices`, historyRouter);
router.use(`/devices`, authRouter);
router.use(`/devices`, joinRouter);

export default router;
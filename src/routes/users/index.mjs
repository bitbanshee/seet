import Router from 'express-promise-router'
import authRouter from './auth.mjs'

const router = new Router();
router.use(`/users`, authRouter);

export default router;
// MODULES
import { Router } from "express";

// ROUTERS
import authenticationRouter from "./authentication.router";
import userRouter from "./user.router";
import deviceRouter from "./device.router";
import deviceRelayRouter from "./device-relay.router";
import deviceParamRouter from "./device-param.router";

const router = Router();

router.use('/auth', authenticationRouter)
router.use('/api/users', userRouter);
router.use('/api/devices', deviceRouter);
router.use('/api/device-relays', deviceRelayRouter);
router.use('/api/device-params', deviceParamRouter);

export default router;

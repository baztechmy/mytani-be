// MODULES
import { Router } from "express";

// ROUTERS
import authenticationRouter from "./authentication.router";
import userRouter from "./user.router";
import deviceRouter from "./device.router";
const router = Router();

router.use('/auth', authenticationRouter)
router.use('/api/users', userRouter);
router.use('/api/devices', deviceRouter);

export default router;

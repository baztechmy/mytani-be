// MODULES
import { Router } from "express";

// ROUTERS
import userRouter from "./user.router";
import authenticationRouter from "./authentication.router";
const router = Router();

router.use('/auth', authenticationRouter)
router.use('/api/users', userRouter);

export default router;

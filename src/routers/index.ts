// MODULES
import { Router } from "express";

// ROUTERS
import authenticationRouter from "./authentication.router";
import companyRouter from "./company.router";
import userRouter from "./user.router";
import siteRouter from "./site.router";
import deviceRouter from "./device.router";

const router = Router();

router.use('/auth', authenticationRouter)
router.use('/api/companies', companyRouter);
router.use('/api/users', userRouter);
router.use('/api/sites', siteRouter);
router.use('/api/devices', deviceRouter);

export default router;

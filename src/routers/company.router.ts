// CONTROLLERS
import {
    createCompanyHandler,
    findAllCompanyHandler,
    findCompanyHandler,
    updateCompanyHandler,
    deleteCompanyHandler,
} from '../controllers/company.controller';
import { UserHandler } from '../controllers/user.controller';
import { createSiteByCompanyHandler, findAllSiteByCompanyHandler } from '../controllers/site.controller';
import { DeviceHandler } from '../controllers/device.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const companyRouter = Router();
companyRouter.use(Authorize.accesstoken);

companyRouter.route('/')
    .post(AccessControl.roles(), createCompanyHandler)
    .get(AccessControl.roles(), findAllCompanyHandler);
companyRouter.route('/:comp_id')
    .get(AccessControl.companyAccount(['admin', 'user']), findCompanyHandler)
    .patch(AccessControl.companyAccount(['admin']), updateCompanyHandler)
    .delete(AccessControl.companyAccount(['admin']), deleteCompanyHandler);
companyRouter.route('/:comp_id/users')
    .post(AccessControl.companyAccount(['admin']), UserHandler.createByCompany)
    .get(AccessControl.companyAccount(['admin']), UserHandler.findAllByCompany);
companyRouter.route('/:comp_id/sites')
    .post(AccessControl.companyAccount(['admin']), createSiteByCompanyHandler)
    .get(AccessControl.companyAccount(['admin', 'user']), findAllSiteByCompanyHandler);
companyRouter.route('/:comp_id/devices')
    .get(AccessControl.companyAccount(), DeviceHandler.findAllByCompany);

export default companyRouter;

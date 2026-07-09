// CONTROLLERS
import { CompanyHandler } from '../controllers/company.controller';
import { UserHandler } from '../controllers/user.controller';
import { SiteHandler } from '../controllers/site.controller';
import { DeviceHandler } from '../controllers/device.controller';

// MIDDLEWARES
import AC from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const companyRouter = Router();
companyRouter.use(Authorize.accesstoken);

companyRouter.route('/')
    .post(AC.roles(), CompanyHandler.create)
    .get(AC.roles(), CompanyHandler.findAll);
companyRouter.route('/:comp_id')
    .get(AC.companyAccount(['admin', 'user']), CompanyHandler.find)
    .patch(AC.companyAccount(['admin']), CompanyHandler.update)
    .delete(AC.companyAccount(['admin']), CompanyHandler.remove);
companyRouter.route('/:comp_id/users')
    .post(AC.companyAccount(['admin']), UserHandler.createByCompany)
    .get(AC.companyAccount(['admin']), UserHandler.findAllByCompany);
companyRouter.route('/:comp_id/sites')
    .post(AC.companyAccount(['admin']), SiteHandler.createByCompany)
    .get(AC.companyAccount(['admin', 'user']), SiteHandler.findAllByCompany);
companyRouter.route('/:comp_id/devices')
    .get(AC.companyAccount(), DeviceHandler.findAllByCompany);

export default companyRouter;

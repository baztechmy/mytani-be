// CONTROLLERS
import { DeviceHandler } from '../controllers/device.controller';
import { SiteHandler } from '../controllers/site.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const siteRouter = Router();
siteRouter.use(Authorize.accesstoken);

siteRouter.route('/')
    .get(AccessControl.roles(), SiteHandler.findAll);
siteRouter.route('/:site_id')
    .get(AccessControl.siteOwner(['admin', 'user']), SiteHandler.find)
    .patch(AccessControl.siteOwner(['admin']), SiteHandler.update)
    .delete(AccessControl.siteOwner(['admin']), SiteHandler.remove);
siteRouter.route('/:site_id/devices')
    .post(AccessControl.siteOwner(['admin']), DeviceHandler.createBySite)
    .get(AccessControl.siteOwner(['admin', 'user']), DeviceHandler.findAllBySite);

export default siteRouter;

// CONTROLLERS
import { DeviceHandler } from '../controllers/device.controller';
import { SiteHandler } from '../controllers/site.controller';

// MIDDLEWARES
import AC from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const siteRouter = Router();
siteRouter.use(Authorize.accesstoken);

siteRouter.route('/')
    .get(AC.roles(), SiteHandler.findAll);
siteRouter.route('/:site_id')
    .get(AC.siteOwner(['admin', 'user']), SiteHandler.find)
    .patch(AC.siteOwner(['admin']), SiteHandler.update)
    .delete(AC.siteOwner(['admin']), SiteHandler.remove);
siteRouter.route('/:site_id/devices')
    .post(AC.siteOwner(['admin']), DeviceHandler.createBySite)
    .get(AC.siteOwner(['admin', 'user']), DeviceHandler.findAllBySite);

export default siteRouter;

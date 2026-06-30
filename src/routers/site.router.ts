// CONTROLLERS
import {
    findAllSiteHandler,
    findSiteHandler,
    updateSiteHandler,
    deleteSiteHandler,
} from '../controllers/site.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const siteRouter = Router();
siteRouter.use(Authorize.accesstoken);

siteRouter.route('/')
    .get(AccessControl.roles(), findAllSiteHandler);
siteRouter.route('/:site_id')
    .get(AccessControl.siteOwner(['admin', 'user']), findSiteHandler)
    .patch(AccessControl.siteOwner(['admin']), updateSiteHandler)
    .delete(AccessControl.siteOwner(['admin']), deleteSiteHandler);

export default siteRouter;

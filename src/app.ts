// APP
import router from "./routers";

// CONFIGS
import env from "./configs/env.config";
import { db } from "./configs/db.config";

// MODULES
import App from "@harrypoggers25/app-express";
import cookieParser from 'cookie-parser';

App.listen({
    port: env.PORT,
    version: '1.0.0 Build 1',
    cors: [env.ORIGIN_URL],
    beforeListen: async (app) => {
        app.use(cookieParser());
        app.use('/', router);
    },
    callback: async () => {
        await db.sync({ alter: false });
    }
});


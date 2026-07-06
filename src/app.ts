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
    version: '1.0.0 Build 2',
    cors: [env.ORIGIN_URL],
    beforeListen: async (app) => {
        app.use(cookieParser());
        app.use('/', router);
    },
    callback: async () => {
        await db.sync({ alter: false });

        const devices = await Device.find();
        if (!devices) throw new Error('Failed to sync device data instances. Unable to find devices');

        for (const { d_id, can_monitor } of devices) {
            if (can_monitor) createDeviceData(d_id);
        }
    }
});


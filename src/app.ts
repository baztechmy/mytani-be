// MODULES
import App from "@harrypoggers25/app-express";
// import ch from "@harrypoggers25/color-utils";
// import cookieParser from 'cookie-parser';

// CONFIGS
import env from "./configs/env.config";

// HELPERS
// import { parseJson } from "./helpers/mqtt.helper";

// APP
// import router from "./routers";
// import { mqttClient } from "./configs/mqtt.config";

App.listen({
    port: env.PORT,
    version: '1.0.0 Build 1',
    cors: [env.ORIGIN_URL],
    // beforeListen: async (app) => {
    //     app.use(cookieParser());
    //     app.use('/', router);
    // },
    callback: async () => {
    }
});


// CONFIGS
import { db } from "../configs/db.config";
import Script from "../helpers/script.helper";

db.sync({
    alter: true,
    onSuccessAlter: async (transaction) => {
        await Script.createUsers(transaction);
    }
})

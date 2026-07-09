// CONFIGS
import { db } from "../configs/db.config";
import Script from "../helpers/script.helper";

db.sync({
    alter: true,
    onSuccessAlter: async (transaction) => {
        console.log(ch.green('CREATE SCRIPT:'), `Altered db. All previous data have been`, ch.red('deleted'));

        const date = new Date();
        await Script.createUsers(date, transaction);
    }
})

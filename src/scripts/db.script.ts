// CONFIGS
import ch from "@harrypoggers25/color-utils";
import Script from "../helpers/script.helper";
import { db } from "../configs/db.config";

db.sync({
    alter: true,
    onSuccessAlter: async (transaction) => {
        console.log(ch.green('CREATE SCRIPT:'), `Altered db. All previous data have been`, ch.red('deleted'));

        const date = new Date();
        await Script.createUsers(date, transaction);

        console.log(ch.green('CREATE SCRIPT:'), `Altered db. New data has been`, ch.green('updated'));
    }
})

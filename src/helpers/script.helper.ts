// CONFIGS
import env from '../configs/env.config';
import { Company, Device, Site, User, UserSecret } from '../configs/db.config';

// MODULES
import ch from '@harrypoggers25/color-utils';
import { hashSync } from 'bcrypt-ts';

// HELPERS
import Message from "@harrypoggers25/message";

namespace Script {
    export async function createUsers(date: Date, transaction: any) {
        const comp_name = 'Super';
        const company = await Company.create({ comp_name, created_at: date, updated_at: date }, { transaction });
        if (!company) return console.log(ch.red('CREATE COMPANY ERROR:'), Message.failed(['create', 'company', { comp_name }]));


        const comp_id = company.comp_id;
        const users: Array<Partial<ReturnType<typeof User.getEmptyModel>>> = [
            { user_name: 'Super', user_email: 'superadmin@email.com', user_role: 'superadmin', comp_id, created_by: 1, updated_at: date, created_at: date },
            { user_name: 'Admin', user_email: 'admin@email.com', user_role: 'admin', comp_id, created_by: 1, updated_at: date, created_at: date },
            { user_name: 'User', user_email: 'user@email.com', user_role: 'user', comp_id, created_by: 1, updated_at: date, created_at: date },
        ];
        for (const body of users) {
            const { user_email } = body;
            const user = await User.create(body, { transaction });
            if (!user) return console.log(ch.red('CREATE USER ERROR:'), Message.failed(['create', 'user', user_email]));

            const { user_id } = user;
            const userSecret = await UserSecret.create({ user_password: hashSync(user.user_email, env.BCRYPT_SALT), user_id }, { transaction });
            if (!userSecret) return console.log(ch.red('CREATE USER SECRET ERROR:'), Message.failed(['create', 'user', user_email], {
                causer: ['create', 'user secret'],
            }));
        }

        return { company, users };
    }
    export async function createDevices(date: Date, transaction: any) {
        const site_name = "Test site";
        const [updated_at, created_at] = [date, date];
        const site = await Site.create(
            { site_name, site_location: "No where", comp_id: 1, updated_at, created_at },
            { transaction }
        );
        if (!site) return console.log(ch.red('CREATE SITE ERROR:'), Message.failed(['create', 'site', { site_name }]));

        const { site_id, comp_id } = site;
        for (const { d_did, d_name, has_relay } of [
            { d_did: "ccba97082958", d_name: "kincony-t16m", has_relay: true },
            { d_did: "esp32-EABF8C", d_name: "kincony-a2-v3" },
        ]) {
            const device = await Device.create(
                { d_did, d_name, comp_id, has_relay, site_id },
                { transaction }
            );
            if (!device) return console.log(ch.red('CREATE DEVICE ERROR:'), Message.failed(['create', 'device', { d_did }]));
        }
    }
}
export default Script;

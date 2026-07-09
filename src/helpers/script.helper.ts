// CONFIGS
import env from '../configs/env.config';
import { Company, User, UserSecret } from '../configs/db.config';

// MODULES
import ch from '@harrypoggers25/color-utils';
import { hashSync } from 'bcrypt-ts';

// HELPERS
import Message from './message.helper';

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
    }
}
export default Script;

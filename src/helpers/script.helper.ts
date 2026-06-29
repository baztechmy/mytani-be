// CONFIGS
import env from '../configs/env.config';
import { User, UserSecret } from '../configs/db.config';

// MODULES
import ch from '@harrypoggers25/color-utils';
import { hashSync } from 'bcrypt-ts';

namespace Script {
    export async function createUsers(transaction: any) {
        console.log(ch.green('CREATE USERS SCRIPT:'), `Altered db. All previous data have been`, ch.red('deleted'));

        const date = new Date();
        const users: Array<Partial<ReturnType<typeof User.getEmptyModel>>> = [
            { user_name: 'Super', user_email: 'superadmin@email.com', user_role: 'superadmin', created_by: 1, updated_at: date, created_at: date },
            { user_name: 'Admin', user_email: 'admin@email.com', user_role: 'admin', created_by: 1, updated_at: date, created_at: date },
            { user_name: 'User', user_email: 'user@email.com', user_role: 'user', created_by: 1, updated_at: date, created_at: date },
        ];
        for (const body of users) {
            const user = await User.create(body, { transaction });
            if (!user) {
                console.log(ch.red('CREATE USER ERROR:'), `Failed to create user [${body.user_id}]`);
                return;
            }

            const { user_id } = user;
            const userSecret = await UserSecret.create({ user_password: hashSync(user.user_email, env.BCRYPT_SALT), user_id }, { transaction });
            if (!userSecret) console.log(ch.red('CREATE USER SECRET ERROR:'), `Failed to create user secret [${body.user_id}]`);
        }

    }
}
export default Script;

// MODULES
import Db, { DataTypes } from '@harrypoggers25/db-postgresql';
import env from './env.config.js';

export const db = Db.config({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT
});

export const User = db.define('users', {
    user_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    user_name: { type: DataTypes.VARCHAR(255), allowNull: false },
    user_email: { type: DataTypes.VARCHAR(255), allowNull: false, unique: true },
    user_phone: { type: DataTypes.VARCHAR(255), allowNull: true },
    user_role: { type: DataTypes.VARCHAR(255), allowNull: false, check: "user_role IN ('user', 'admin')" },
    created_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
});

export const UserSecret = db.define('user_secrets', {
    user_password: { type: DataTypes.VARCHAR(255), allowNull: false },
    user_refresh_token: { type: DataTypes.TEXT, allowNull: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true }
});
UserSecret.setForeignKey(User, 'user_id');

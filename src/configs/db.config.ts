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
    user_role: { type: DataTypes.VARCHAR(255), allowNull: false, check: "user_role IN ('user', 'admin', 'superadmin')" },
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

export const UserActivityLog = db.define('user_activity_logs', {
    ual_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    ual_type: { type: DataTypes.VARCHAR(255), allowNull: false },
    ual_activity: { type: DataTypes.TEXT, allowNull: false },
    ual_date: { type: DataTypes.TIMESTAMP, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
});
UserActivityLog.setForeignKey(User, 'user_id');

export const Device = db.define('devices', {
    d_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    d_did: { type: DataTypes.VARCHAR(255), allowNull: false, unique: true },
    d_name: { type: DataTypes.VARCHAR(255), allowNull: false },
    can_monitor: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_control: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
});
Device.setForeignKey(User, 'user_id');

export const DeviceState = db.define('device_states', {
    alive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    d_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
});
DeviceState.setForeignKey(Device, 'd_id');

export const DeviceRelay = db.define('device_relays', {
    relay_names: { type: DataTypes.TEXT, allowNull: false },
    relay_vals: { type: DataTypes.TEXT, allowNull: false },
    count: { type: DataTypes.INTEGER, allowNull: false },
    d_id: { type: DataTypes.SERIAL, allowNull: false, unique: true },
});
DeviceRelay.setForeignKey(Device, 'd_id');

export const DeviceParam = db.define('device_params', {
    dp_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    dp_did: { type: DataTypes.VARCHAR(255), allowNull: false, unique: true },
    dp_name: { type: DataTypes.VARCHAR(255), allowNull: false },
    dp_target: { type: DataTypes.NUMERIC(30, 3), allowNull: true },
    created_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    d_id: { type: DataTypes.SERIAL, allowNull: false },
}, { extraScript: { in: 'UNIQUE (dp_did, d_id)', } });
DeviceParam.setForeignKey(Device, 'd_id');

export const DeviceDatas: Record<number, ReturnType<typeof db.define>> = {};
export function createDeviceData(d_id: number) {
    const DeviceData = db.define(`device_data_${d_id}`, {
        dd_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
        raw_data: { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' },
        dd_date: { type: DataTypes.TIMESTAMP, allowNull: false },
    });
    DeviceDatas[d_id] = DeviceData;

    return DeviceData;
}


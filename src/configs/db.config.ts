// MODULES
import Db, { DataTypes } from '@harrypoggers25/db-postgresql';
import env from './env.config.js';

// MIDDLEWARES
import { stringifyRoles } from '../middlewares/access-control.middleware.js';

export const db = Db.config({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT
});

export const Company = db.define('companies', {
    comp_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    comp_name: { type: DataTypes.VARCHAR(511), allowNull: false },
    created_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
});

export const User = db.define('users', {
    user_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    user_name: { type: DataTypes.VARCHAR(255), allowNull: false },
    user_email: { type: DataTypes.VARCHAR(255), allowNull: false, unique: true },
    user_phone: { type: DataTypes.VARCHAR(255), allowNull: true },
    user_role: { type: DataTypes.VARCHAR(255), allowNull: false, check: `user_role IN (${stringifyRoles(['user', 'admin', 'superadmin'])})` },
    comp_id: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
});
User.setForeignKey(Company, 'comp_id');

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

export const Site = db.define('sites', {
    site_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    site_name: { type: DataTypes.VARCHAR(255), allowNull: false },
    site_location: { type: DataTypes.VARCHAR(1023), allowNull: false },
    comp_id: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
});
Site.setForeignKey(Company, 'comp_id');

export const Device = db.define('devices', {
    d_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    d_did: { type: DataTypes.VARCHAR(255), allowNull: false, unique: true },
    d_name: { type: DataTypes.VARCHAR(255), allowNull: false },
    can_monitor: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_control: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    comp_id: { type: DataTypes.INTEGER, allowNull: false },
    site_id: { type: DataTypes.INTEGER, allowNull: false },
});
Device.setForeignKey(Company, 'comp_id');
Device.setForeignKey(Site, 'site_id');

export const DeviceState = db.define('device_states', {
    alive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    d_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
});
DeviceState.setForeignKey(Device, 'd_id');

export const DeviceRelay = db.define('device_relays', {
    dr_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    dr_name: { type: DataTypes.VARCHAR(255), allowNull: false },
    current_state: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    previous_state: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    d_id: { type: DataTypes.INTEGER, allowNull: false },
});
DeviceRelay.setForeignKey(Device, 'd_id');

export const DeviceRelaySchedule = db.define('device_relay_schedules', {
    drs_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    drs_name: { type: DataTypes.TEXT, allowNull: false },
    action: { type: DataTypes.BOOLEAN, allowNull: false },
    time: { type: DataTypes.TIME, allowNull: false },
    recurrence: { type: DataTypes.TEXT, allowNull: false },
    start_at: { type: DataTypes.DATE, allowNull: false },
    end_at: { type: DataTypes.DATE, allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    dr_id: { type: DataTypes.INTEGER, allowNull: false },
});
DeviceRelaySchedule.setForeignKey(DeviceRelay, 'dr_id');

export const DeviceControlParam = db.define('device_control_params', {
    dcp_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    dcp_tag: { type: DataTypes.VARCHAR(255), allowNull: false },
    dcp_name: { type: DataTypes.VARCHAR(511), allowNull: false },
    dcp_unit: { type: DataTypes.VARCHAR(16), allowNull: false },
    created_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    d_id: { type: DataTypes.SERIAL, allowNull: false },
}, { extraScript: { in: 'UNIQUE (dcp_tag, d_id)', } });
DeviceControlParam.setForeignKey(Device, 'd_id');

export const DeviceMonitorParam = db.define('device_monitor_params', {
    dmp_id: { type: DataTypes.SERIAL, allowNull: false, primaryKey: true },
    dmp_tag: { type: DataTypes.VARCHAR(255), allowNull: false },
    dmp_name: { type: DataTypes.VARCHAR(511), allowNull: false },
    dmp_unit: { type: DataTypes.VARCHAR(16), allowNull: false },
    dmp_target: { type: DataTypes.NUMERIC(30, 3), allowNull: true },
    created_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    updated_at: { type: DataTypes.TIMESTAMP, allowNull: false },
    d_id: { type: DataTypes.SERIAL, allowNull: false },
}, { extraScript: { in: 'UNIQUE (dmp_tag, d_id)', } });
DeviceMonitorParam.setForeignKey(Device, 'd_id');

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


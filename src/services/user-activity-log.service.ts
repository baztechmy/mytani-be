// MODULES
import { Pool } from "@harrypoggers25/db-postgresql";

// CONFIGS
import { UserActivityLog } from "../configs/db.config";

type Body = Partial<ReturnType<typeof UserActivityLog.getEmptyModel>>;

export async function createUserActivityLog(body: Body, transaction?: Pool.Transaction) {
    const { ual_id, ual_type, ual_activity, user_id, } = body;
    const ual_date = new Date();

    const ual = await UserActivityLog.create(
        { ual_id, ual_type, ual_activity, ual_date, user_id, },
        { transaction }
    );

    return ual;
}

export async function findUserActivityLog(where?: Body, transaction?: Pool.Transaction) {
    return await UserActivityLog.find({ where, orderBy: { ual_date: 'ASC' }, transaction });
}

export async function deleteUserActivityLog(where?: Body, transaction?: Pool.Transaction) {
    return await UserActivityLog.delete({ where, transaction });
}

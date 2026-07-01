import { stringifyJson } from "./json.helper";

namespace Message {
    type Actions = 'create' | 'find' | 'update' | 'delete';
    export function failed(action: Actions, effector: string, options: { where?: any, causer?: [Actions, string], causerMessage?: string } = {}): string {
        const { causer, causerMessage } = options;
        let { where } = options;
        where = where === undefined ? '' : options.where === null ? ' [null]' :
            ['string', 'number'].includes(typeof where) ? ` [${where}]` : ` ${stringifyJson(where)}`;

        if (causerMessage) return `Failed to ${action} ${effector}${where}. ${causerMessage}`;
        if (!causer) return `Failed to ${action} ${effector}${where}`;
        return `Failed to ${action} ${effector}${where}. Unable to ${causer[0]} ${causer[1]}`;
    }
}

export default Message;

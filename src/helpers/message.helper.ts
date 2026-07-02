import { stringifyJson } from "./json.helper";

namespace Message {
    type Actions = 'create' | 'add' | 'find' | 'update' | 'delete' | 'login' | 'logout';
    type ArrayBody = [Actions, string, any] | [Actions, string];

    function formatKey(key: any): string {
        return key === undefined ? '' : key === null ? ' [null]' : ['string', 'number'].includes(typeof key) ? ` [${key}]` : ` ${stringifyJson(key)}`;
    }

    function formatAction(action: Actions): string {
        const map: Record<Actions, string> = {
            'create': 'Created',
            'add': 'Added',
            'find': 'Fetched',
            'update': 'Updated',
            'delete': 'Deleted',
            'login': 'Logged in',
            'logout': 'Logged out',
        }
        return map[action];
    }

    type FailedOptions = { causer?: ArrayBody, subMessage?: string };
    export function failed(effector: ArrayBody, options: FailedOptions = {}): string {
        const { causer, subMessage } = options;
        const key1 = formatKey(effector?.[2]);
        const key2 = formatKey(causer?.[2]);

        if (subMessage) return `Failed to ${effector[0]} ${effector[1]}${key1}. ${subMessage}`;
        if (!causer) return `Failed to ${effector[0]} ${effector[1]}${key1}`;
        return `Failed to ${effector[0]} ${effector[1]}${key1}. Unable to ${causer[0]} ${causer[1]}${key2}`;
    }
    export function success(effector: ArrayBody): string {
        const key = formatKey(effector?.[2]);
        const action = formatAction(effector[0]);

        return `${action} ${effector[1]}${key}`;
    }
}

export default Message;

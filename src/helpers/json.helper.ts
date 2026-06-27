export function parseJson<T = any>(str: string): T | null {
    try {
        const parsedStr = JSON.parse(str);
        return parsedStr;
    } catch (error: any) {
        return null;
    }
}

export function stringifyJson(obj: any) {
    return JSON.stringify(obj);
}

export function isArrayObj(obj: any, type: string): obj is Array<any> {
    return (Array.isArray(obj) && obj.some(val => typeof val === type));
}

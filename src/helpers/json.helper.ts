import ch from "@harrypoggers25/color-utils";

export function parseJson<T = any>(str: string): T | null {
    try {
        const parsedStr = JSON.parse(str);
        return parsedStr;
    } catch (error: any) {
        console.log(ch.red('PARSE JSON ERROR:'), error.message ?? error);
        return null;
    }
}

export function stringifyJson(obj: any) {
    try {
        return JSON.stringify(obj);
    } catch (error: any) {
        console.log(ch.red('STRINGIFY JSON ERROR:'), error.message ?? error);
        return 'undefined';
    }
}

export function isArrayObj<T = any>(obj: any, every?: (elem: any) => boolean): obj is Array<T> {
    every = every ?? (() => true)

    return (Array.isArray(obj) && obj.every(every));
}

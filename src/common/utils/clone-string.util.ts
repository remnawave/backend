export function cloneString(str: string, limit: number = 100, prefix: string = '#_') {
    let inputString = str;
    if (str.startsWith(prefix)) {
        inputString = str.slice(prefix.length + 3);
    }
    const randomString = Math.random().toString(36).substring(2, 5);
    const resultString = `${prefix}${randomString} ${inputString}`;
    return resultString.slice(0, limit);
}

export function definedProps(obj: any) {
    if (obj === undefined || obj === null) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(obj)
            .map(([k, v]) => [k, v ? v : undefined]) // 將null轉成undefined
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([k, v]) => v !== undefined),
    );
}

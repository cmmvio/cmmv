/**
 * Get a value from a key
 * @param data - The data
 * @param key - The key
 * @returns The value
 */
export function getValueFromKey(data: Record<string, any>, key: string): any {
    return key.split('.').reduce((acc, part) => acc && acc[part], data);
}

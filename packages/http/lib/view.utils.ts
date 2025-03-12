export function getValueFromKey(data: Record<string, any>, key: string): any {
    return key.split('.').reduce((acc, part) => acc && acc[part], data);
}

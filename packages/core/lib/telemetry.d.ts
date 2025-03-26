import { Singleton } from '../abstracts';
type TelemetryRecord = {
    id: string;
    label: string;
    startTime: number;
    endTime?: number;
};
export declare class Telemetry extends Singleton {
    private records;
    private processTimer;
    plugins: any[];
    static registerPlugin(plugin: any): void;
    static start(label: string, requestId?: string): void;
    static end(label: string, requestId?: string): void;
    static getProcessTimer(requestId?: string): number;
    static getTelemetry(requestId?: string): TelemetryRecord[] | null;
    static clearTelemetry(requestId?: string): boolean;
    static getRecords(): Map<string, TelemetryRecord[]>;
    private generateId;
}
export {};

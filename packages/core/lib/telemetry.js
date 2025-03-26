"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telemetry = void 0;
const abstracts_1 = require("../abstracts");
class Telemetry extends abstracts_1.Singleton {
    constructor() {
        super(...arguments);
        this.records = new Map();
        this.processTimer = new Map();
        this.plugins = [];
    }
    static registerPlugin(plugin) {
        const telemetry = Telemetry.getInstance();
        telemetry.plugins.push(plugin);
    }
    static start(label, requestId) {
        if (requestId) {
            const telemetry = Telemetry.getInstance();
            if (!telemetry.records.has(requestId))
                telemetry.records.set(requestId, []);
            if (!telemetry.processTimer.has(requestId))
                telemetry.processTimer.set(requestId, {
                    start: Date.now(),
                    end: 0,
                });
            telemetry.records.get(requestId)?.push({
                id: telemetry.generateId(),
                label,
                startTime: Date.now(),
            });
        }
    }
    static end(label, requestId) {
        if (requestId) {
            const telemetry = Telemetry.getInstance();
            const record = telemetry.records
                .get(requestId)
                ?.find(r => r.label === label && !r.endTime);
            if (telemetry.processTimer.has(requestId)) {
                const timer = telemetry.processTimer.get(requestId);
                timer.end = Date.now();
                telemetry.processTimer.set(requestId, timer);
            }
            if (record)
                record.endTime = Date.now();
        }
    }
    static getProcessTimer(requestId) {
        if (requestId) {
            const telemetry = Telemetry.getInstance();
            if (telemetry.processTimer.has(requestId)) {
                const timer = telemetry.processTimer.get(requestId);
                return timer.end - timer.start;
            }
        }
        return 0;
    }
    static getTelemetry(requestId) {
        if (requestId) {
            const telemetry = Telemetry.getInstance();
            return telemetry.records.get(requestId) || null;
        }
        else {
            return null;
        }
    }
    static clearTelemetry(requestId) {
        if (requestId) {
            const telemetry = Telemetry.getInstance();
            if (telemetry.records.has(requestId))
                telemetry.records.delete(requestId);
            if (telemetry.processTimer.has(requestId))
                telemetry.processTimer.delete(requestId);
            return true;
        }
        return false;
    }
    static getRecords() {
        return Telemetry.getInstance().records;
    }
    generateId() {
        return (Math.random() + 1).toString(36).substring(7);
    }
}
exports.Telemetry = Telemetry;

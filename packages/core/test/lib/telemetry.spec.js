"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const telemetry_1 = require("../../lib/telemetry");
(0, vitest_1.describe)('Telemetry', () => {
    const requestId = 'testRequestId';
    (0, vitest_1.beforeEach)(() => {
        telemetry_1.Telemetry.clearTelemetry(requestId);
    });
    (0, vitest_1.it)('should start a telemetry record', () => {
        telemetry_1.Telemetry.start('TestLabel', requestId);
        const records = telemetry_1.Telemetry.getTelemetry(requestId);
        (0, vitest_1.expect)(records).toBeTruthy();
        (0, vitest_1.expect)(records.length).toBe(1);
        (0, vitest_1.expect)(records[0].label).toBe('TestLabel');
        (0, vitest_1.expect)(records[0].endTime).toBeUndefined();
    });
    (0, vitest_1.it)('should end a telemetry record', () => {
        telemetry_1.Telemetry.start('TestLabel', requestId);
        telemetry_1.Telemetry.end('TestLabel', requestId);
        const records = telemetry_1.Telemetry.getTelemetry(requestId);
        (0, vitest_1.expect)(records).toBeTruthy();
        (0, vitest_1.expect)(records.length).toBe(1);
        (0, vitest_1.expect)(records[0].label).toBe('TestLabel');
        (0, vitest_1.expect)(typeof records[0].endTime).toBe('number');
    });
    (0, vitest_1.it)('should not end a non-existent telemetry record', () => {
        telemetry_1.Telemetry.end('NonExistentLabel', requestId);
        const records = telemetry_1.Telemetry.getTelemetry(requestId);
        (0, vitest_1.expect)(records).toBeNull();
    });
    (0, vitest_1.it)('should register a plugin', () => {
        const plugin = { name: 'TestPlugin' };
        telemetry_1.Telemetry.registerPlugin(plugin);
        const telemetryInstance = telemetry_1.Telemetry.getInstance();
        (0, vitest_1.expect)(telemetryInstance.plugins.length).toBe(1);
        (0, vitest_1.expect)(telemetryInstance.plugins[0]).toBe(plugin);
    });
    (0, vitest_1.it)('should clear telemetry records', () => {
        telemetry_1.Telemetry.start('TestLabel', requestId);
        telemetry_1.Telemetry.clearTelemetry(requestId);
        const records = telemetry_1.Telemetry.getTelemetry(requestId);
        (0, vitest_1.expect)(records).toBeNull();
    });
    (0, vitest_1.it)('should generate unique ids for telemetry records', () => {
        telemetry_1.Telemetry.start('TestLabel1', requestId);
        telemetry_1.Telemetry.start('TestLabel2', requestId);
        const records = telemetry_1.Telemetry.getTelemetry(requestId);
        (0, vitest_1.expect)(records).toBeTruthy();
        (0, vitest_1.expect)(records.length).toBe(2);
        (0, vitest_1.expect)(records[0].id).not.toBe(records[1].id);
    });
    (0, vitest_1.it)('should retrieve all telemetry records', () => {
        telemetry_1.Telemetry.start('TestLabel1', requestId);
        telemetry_1.Telemetry.start('TestLabel2', requestId);
        const allRecords = telemetry_1.Telemetry.getRecords();
        (0, vitest_1.expect)(allRecords).toBeTruthy();
        (0, vitest_1.expect)(allRecords.size).toBe(1);
        (0, vitest_1.expect)(allRecords.get(requestId).length).toBe(2);
    });
});

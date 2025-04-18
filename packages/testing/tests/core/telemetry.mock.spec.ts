import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockTelemetry, mockTelemetry } from '../../core/telemetry.mock';

describe('MockTelemetry', () => {
    beforeEach(() => {
        MockTelemetry.reset();
        // Mock Date.now para testes consistentes
        vi.spyOn(Date, 'now').mockImplementation(() => 1000);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should register a plugin', () => {
        const plugin = { name: 'testPlugin' };
        MockTelemetry.registerPlugin(plugin);

        expect(MockTelemetry.plugins).toContain(plugin);
        expect(MockTelemetry.registerPlugin).toHaveBeenCalledWith(plugin);
    });

    it('should start telemetry record', () => {
        const requestId = 'request-123';
        MockTelemetry.start('Operation', requestId);

        const records = MockTelemetry.records.get(requestId);
        expect(records.length).toBe(1);
        expect(records[0].label).toBe('Operation');
        expect(records[0].startTime).toBe(1000);
        expect(MockTelemetry.start).toHaveBeenCalledWith(
            'Operation',
            requestId,
        );
    });

    it('should ignore start without requestId', () => {
        MockTelemetry.start('Operation');
        expect(MockTelemetry.records.size).toBe(0);
    });

    it('should create process timer on first start', () => {
        const requestId = 'request-123';
        MockTelemetry.start('Operation', requestId);

        const timer = MockTelemetry.processTimer.get(requestId);
        expect(timer).toBeDefined();
        expect(timer.start).toBe(1000);
        expect(timer.end).toBe(0);
    });

    it('should end telemetry record', () => {
        const requestId = 'request-123';
        MockTelemetry.start('Operation', requestId);

        // Alterar o tempo para o end
        vi.spyOn(Date, 'now').mockImplementation(() => 2000);

        MockTelemetry.end('Operation', requestId);

        const records = MockTelemetry.records.get(requestId);
        expect(records[0].endTime).toBe(2000);
        expect(MockTelemetry.end).toHaveBeenCalledWith('Operation', requestId);
    });

    it('should update process timer on end', () => {
        const requestId = 'request-123';
        MockTelemetry.start('Operation', requestId);

        // Alterar o tempo para o end
        vi.spyOn(Date, 'now').mockImplementation(() => 2000);

        MockTelemetry.end('Operation', requestId);

        const timer = MockTelemetry.processTimer.get(requestId);
        expect(timer.end).toBe(2000);
    });

    it('should get process timer duration', () => {
        const requestId = 'request-123';

        // Start com tempo 1000
        MockTelemetry.start('Operation', requestId);

        // End com tempo 3000
        vi.spyOn(Date, 'now').mockImplementation(() => 3000);
        MockTelemetry.end('Operation', requestId);

        const duration = MockTelemetry.getProcessTimer(requestId);
        expect(duration).toBe(2000); // 3000 - 1000
        expect(MockTelemetry.getProcessTimer).toHaveBeenCalledWith(requestId);
    });

    it('should return 0 for non-existent timer', () => {
        const duration = MockTelemetry.getProcessTimer('non-existent');
        expect(duration).toBe(0);
    });

    it('should get telemetry records', () => {
        const requestId = 'request-123';
        MockTelemetry.start('Operation', requestId);

        const records = MockTelemetry.getTelemetry(requestId);
        expect(records).toHaveLength(1);
        expect(records[0].label).toBe('Operation');
        expect(MockTelemetry.getTelemetry).toHaveBeenCalledWith(requestId);
    });

    it('should return null for non-existent records', () => {
        const records = MockTelemetry.getTelemetry('non-existent');
        expect(records).toBeNull();
    });

    it('should clear telemetry for a request', () => {
        const requestId = 'request-123';
        MockTelemetry.start('Operation', requestId);

        expect(MockTelemetry.records.has(requestId)).toBe(true);
        expect(MockTelemetry.processTimer.has(requestId)).toBe(true);

        const result = MockTelemetry.clearTelemetry(requestId);

        expect(result).toBe(true);
        expect(MockTelemetry.records.has(requestId)).toBe(false);
        expect(MockTelemetry.processTimer.has(requestId)).toBe(false);
        expect(MockTelemetry.clearTelemetry).toHaveBeenCalledWith(requestId);
    });

    it('should return true when clearing non-existent telemetry', () => {
        const result = MockTelemetry.clearTelemetry('non-existent');
        expect(result).toBe(true);
    });

    it('should get all records', () => {
        const requestId1 = 'request-1';
        const requestId2 = 'request-2';

        MockTelemetry.start('Operation1', requestId1);
        MockTelemetry.start('Operation2', requestId2);

        const records = MockTelemetry.getRecords();

        expect(records.size).toBe(2);
        expect(records.has(requestId1)).toBe(true);
        expect(records.has(requestId2)).toBe(true);
        expect(MockTelemetry.getRecords).toHaveBeenCalled();
    });

    it('should reset all telemetry data and mocks', () => {
        const requestId = 'request-123';
        MockTelemetry.start('Operation', requestId);

        expect(MockTelemetry.records.size).toBe(1);
        expect(MockTelemetry.processTimer.size).toBe(1);
        expect(MockTelemetry.start).toHaveBeenCalled();

        MockTelemetry.reset();

        expect(MockTelemetry.records.size).toBe(0);
        expect(MockTelemetry.processTimer.size).toBe(0);
        expect(MockTelemetry.plugins).toEqual([]);
        expect(MockTelemetry.start.mock.calls.length).toBe(0);
    });

    it('should provide mock module structure', () => {
        const mockModule = MockTelemetry.getMockModule();
        expect(mockModule).toHaveProperty('Telemetry', MockTelemetry);
    });

    it('should expose mockTelemetry as an alias', () => {
        expect(mockTelemetry).toBe(MockTelemetry);
    });
});

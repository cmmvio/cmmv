import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as protobuf from 'protobufjs';
import { ProtoRegistry } from './protobuf.registry';
import * as sinon from 'sinon';

describe('ProtoRegistry', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        ProtoRegistry.getInstance().protos.clear();
        ProtoRegistry.getInstance().index.clear();
        ProtoRegistry.getInstance().contracts.clear();
        ProtoRegistry.getInstance().types.clear();
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should register a proto file correctly', async () => {
        const root = new protobuf.Root();
        const contract = 'syntax = "proto3";\nmessage TestMessage {}';

        ProtoRegistry.register('TestProto', root, contract);

        expect(ProtoRegistry.retrieve('TestProto')).toBe(root);
        expect(ProtoRegistry.retrieveContract('TestProto')).toBe(contract);
    });

    it('should retrieve proto by key', () => {
        const root = new protobuf.Root();
        ProtoRegistry.getInstance().protos.set('TestProto', root);

        const result = ProtoRegistry.retrieve('TestProto');
        expect(result).toBe(root);
    });

    it('should return null if proto not found', () => {
        const result = ProtoRegistry.retrieve('NonExistentProto');
        expect(result).toBeNull();
    });

    it('should retrieve contract by key', () => {
        const contract = 'syntax = "proto3";\nmessage TestMessage {}';
        ProtoRegistry.getInstance().contracts.set('TestProto', contract);

        const result = ProtoRegistry.retrieveContract('TestProto');
        expect(result).toBe(contract);
    });

    it('should return null if contract not found', () => {
        const result = ProtoRegistry.retrieveContract('NonExistentProto');
        expect(result).toBeNull();
    });

    it('should retrieve types by key and message', () => {
        const typesMap = { TestMessage: 0 };
        ProtoRegistry.getInstance().types.set('TestProto', typesMap);

        const result = ProtoRegistry.retrieveTypes('TestProto', 'TestMessage');
        expect(result).toBe(0);
    });

    it('should return null if types not found', () => {
        const result = ProtoRegistry.retrieveTypes(
            'NonExistentProto',
            'TestMessage',
        );
        expect(result).toBeNull();
    });

    it('should retrieve contract name by index', () => {
        ProtoRegistry.getInstance().index.set(0, 'TestProto');
        const result = ProtoRegistry.retrieveContractName(0);
        expect(result).toBe('TestProto');
    });

    it('should retrieve proto by index', () => {
        const root = new protobuf.Root();
        ProtoRegistry.getInstance().protos.set('TestProto', root);
        ProtoRegistry.getInstance().index.set(0, 'TestProto');

        const result = ProtoRegistry.retrieveByIndex(0);
        expect(result).toBe(root);
    });

    it('should retrieve all contracts', () => {
        const contract = 'syntax = "proto3";\nmessage TestMessage {}';
        ProtoRegistry.getInstance().contracts.set('TestProto', contract);

        const result = ProtoRegistry.retrieveAll();
        expect(result).toEqual({ TestProto: contract });
    });
});

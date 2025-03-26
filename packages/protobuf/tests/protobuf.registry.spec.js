"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const protobuf = require("protobufjs");
const protobuf_registry_1 = require("../lib/protobuf.registry");
const sinon = require("sinon");
(0, vitest_1.describe)('ProtoRegistry', () => {
    let sandbox;
    (0, vitest_1.beforeEach)(() => {
        protobuf_registry_1.ProtoRegistry.getInstance().protos.clear();
        protobuf_registry_1.ProtoRegistry.getInstance().index.clear();
        protobuf_registry_1.ProtoRegistry.getInstance().contracts.clear();
        protobuf_registry_1.ProtoRegistry.getInstance().types.clear();
        sandbox = sinon.createSandbox();
    });
    (0, vitest_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, vitest_1.it)('should register a proto file correctly', async () => {
        const root = new protobuf.Root();
        const contract = 'syntax = "proto3";\nmessage TestMessage {}';
        protobuf_registry_1.ProtoRegistry.register('TestProto', root, contract);
        (0, vitest_1.expect)(protobuf_registry_1.ProtoRegistry.retrieve('TestProto')).toBe(root);
        (0, vitest_1.expect)(protobuf_registry_1.ProtoRegistry.retrieveContract('TestProto')).toBe(contract);
    });
    (0, vitest_1.it)('should retrieve proto by key', () => {
        const root = new protobuf.Root();
        protobuf_registry_1.ProtoRegistry.getInstance().protos.set('TestProto', root);
        const result = protobuf_registry_1.ProtoRegistry.retrieve('TestProto');
        (0, vitest_1.expect)(result).toBe(root);
    });
    (0, vitest_1.it)('should return null if proto not found', () => {
        const result = protobuf_registry_1.ProtoRegistry.retrieve('NonExistentProto');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should retrieve contract by key', () => {
        const contract = 'syntax = "proto3";\nmessage TestMessage {}';
        protobuf_registry_1.ProtoRegistry.getInstance().contracts.set('TestProto', contract);
        const result = protobuf_registry_1.ProtoRegistry.retrieveContract('TestProto');
        (0, vitest_1.expect)(result).toBe(contract);
    });
    (0, vitest_1.it)('should return null if contract not found', () => {
        const result = protobuf_registry_1.ProtoRegistry.retrieveContract('NonExistentProto');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should retrieve types by key and message', () => {
        const typesMap = { TestMessage: 0 };
        protobuf_registry_1.ProtoRegistry.getInstance().types.set('TestProto', typesMap);
        const result = protobuf_registry_1.ProtoRegistry.retrieveTypes('TestProto', 'TestMessage');
        (0, vitest_1.expect)(result).toBe(0);
    });
    (0, vitest_1.it)('should return null if types not found', () => {
        const result = protobuf_registry_1.ProtoRegistry.retrieveTypes('NonExistentProto', 'TestMessage');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should retrieve contract name by index', () => {
        protobuf_registry_1.ProtoRegistry.getInstance().index.set(0, 'TestProto');
        const result = protobuf_registry_1.ProtoRegistry.retrieveContractName(0);
        (0, vitest_1.expect)(result).toBe('TestProto');
    });
    (0, vitest_1.it)('should retrieve proto by index', () => {
        const root = new protobuf.Root();
        protobuf_registry_1.ProtoRegistry.getInstance().protos.set('TestProto', root);
        protobuf_registry_1.ProtoRegistry.getInstance().index.set(0, 'TestProto');
        const result = protobuf_registry_1.ProtoRegistry.retrieveByIndex(0);
        (0, vitest_1.expect)(result).toBe(root);
    });
    (0, vitest_1.it)('should retrieve all contracts', () => {
        const contract = 'syntax = "proto3";\nmessage TestMessage {}';
        protobuf_registry_1.ProtoRegistry.getInstance().contracts.set('TestProto', contract);
        const result = protobuf_registry_1.ProtoRegistry.retrieveAll();
        (0, vitest_1.expect)(result).toEqual({ TestProto: contract });
    });
});

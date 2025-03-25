import { Module } from '@cmmv/core';

import { ProtobufController } from './protobuf.controller';
import { ProtobufTranspile } from './protobuf.transpiler';

export const ProtobufModule = new Module('protobuf', {
    controllers: [ProtobufController],
    transpilers: [ProtobufTranspile],
});

export const ProtobufModuleCompiler = new Module('protobuf', {
    transpilers: [ProtobufTranspile],
});

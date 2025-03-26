"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulingModule = void 0;
const core_1 = require("@cmmv/core");
const scheduling_service_1 = require("./scheduling.service");
exports.SchedulingModule = new core_1.Module('scheduling', {
    providers: [scheduling_service_1.SchedulingService],
});

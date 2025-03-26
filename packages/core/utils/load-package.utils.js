"use strict";
// @see https://github.com/nestjs/nest/blob/master/packages/common/utils/load-package.util.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPackage = loadPackage;
const logger_1 = require("../lib/logger");
const MISSING_REQUIRED_DEPENDENCY = (name, reason) => `The "${name}" package is missing. Please, make sure to install it to take advantage of ${reason}.`;
const logger = new logger_1.Logger('PackageLoader');
function loadPackage(packageName, context, loaderFn) {
    try {
        return loaderFn ? loaderFn() : require(packageName);
    }
    catch (e) {
        logger.error(MISSING_REQUIRED_DEPENDENCY(packageName, context));
        process.exit(1);
    }
}

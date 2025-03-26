"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authChecker = void 0;
const core_1 = require("@cmmv/core");
const jwt = require("jsonwebtoken");
const authChecker = async ({ context }, roles) => {
    const hasAuthModule = core_1.Module.hasModule('auth');
    const isRootAccess = roles.some((item) => typeof item === 'object' && item && item?.rootOnly === true);
    const jwtSecret = core_1.Config.get('auth.jwtSecret');
    if (!context.token)
        return false;
    if (!hasAuthModule)
        return true;
    try {
        const decoded = await jwt.verify(context.token, jwtSecret);
        if (decoded.root)
            return true;
        else if (isRootAccess && !decoded.root)
            return false;
        else if (roles.length <= 0)
            return true;
        if ((roles &&
            Array.isArray(roles) &&
            (!decoded.roles ||
                !roles.some((role) => decoded?.roles.includes(role)))) ||
            (typeof roles == 'string' && !decoded?.roles.includes(roles))) {
            return false;
        }
        return true;
    }
    catch {
        return false;
    }
};
exports.authChecker = authChecker;

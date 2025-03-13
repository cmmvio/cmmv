import { Config, Module } from '@cmmv/core';

import { type AuthChecker } from 'type-graphql';
import * as jwt from 'jsonwebtoken';

interface User {
    id: number;
    roles: string[];
}

interface Context {
    user?: User;
    token?: string;
}

interface IJWTDecoded {
    id: string;
    username: string;
    fingerprint: string;
    root: boolean;
    roles?: string[];
    groups?: string[];
}

export const authChecker: AuthChecker<Context> = async ({ context }, roles) => {
    const hasAuthModule = Module.hasModule('auth');
    const isRootAccess = roles.some(
        (item: any) =>
            typeof item === 'object' && item && item?.rootOnly === true,
    );

    const jwtSecret = Config.get('auth.jwtSecret');

    if (!context.token) return false;

    if (!hasAuthModule) return true;

    try {
        const decoded: IJWTDecoded = await jwt.verify(context.token, jwtSecret);

        if (decoded.root) return true;
        else if (isRootAccess && !decoded.root) return false;
        else if (roles.length <= 0) return true;

        if (
            (roles &&
                Array.isArray(roles) &&
                (!decoded.roles ||
                    !roles.some((role) => decoded?.roles.includes(role)))) ||
            (typeof roles == 'string' && !decoded?.roles.includes(roles))
        ) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
};

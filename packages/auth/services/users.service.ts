import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

import {
    Service,
    AbstractService,
    Resolver,
    Application,
    Config,
    Module,
} from '@cmmv/core';

import { Repository } from '@cmmv/repository';

import { CMMVRenderer, HttpException, HttpStatus } from '@cmmv/http';

import { AuthGroupsService } from './groups.service';
import { AuthOneTimeTokenService } from './one-time-token.service';
import { ETokenType } from '../lib/auth.interface';
import { AuthEmailService } from './email.service';
import { AuthLocationService } from './location.service';

@Service('auth_users')
export class AuthUsersService extends AbstractService {
    constructor(
        private readonly oneTimeTokenService: AuthOneTimeTokenService,
        private readonly locationService: AuthLocationService,
        private readonly emailService: AuthEmailService,
    ) {
        super();
    }

    /**
     * Get user by ID
     * @param userId - The ID of the user to get
     * @returns The user
     */
    public async getUserById(userId: string) {
        const UserEntity = Repository.getEntity('UserEntity');

        return await Repository.findBy(UserEntity, {
            id: userId,
            blocked: false,
        });
    }

    /**
     * Validate email
     * @param userId - The ID of the user to validate email
     * @param res - The response
     * @returns The message of the operation
     */
    public async validateEmail(userId: string, res: any) {
        const UserEntity = Repository.getEntity('UserEntity');

        await Repository.updateById(UserEntity, userId, {
            verifyEmail: true,
        });

        const customTemplate = Config.get<string>(
            'auth.templates.emailValidation',
        );

        const template = customTemplate
            ? customTemplate
            : path.join(__dirname, '..', 'templates', `emailValidation.html`);

        if (!fs.existsSync(template))
            throw new HttpException('Template not found', HttpStatus.NOT_FOUND);

        const templateContent = fs.readFileSync(template, 'utf8');

        res.res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': templateContent.length,
        });

        res.res.end(templateContent);

        return false;
    }

    /**
     * Forgot password
     * @param email - The email of the user to forgot password
     * @returns The message of the operation
     */
    public async forgotPassword(email: string) {
        const UserEntity = Repository.getEntity('UserEntity');
        const user = await Repository.findOne(UserEntity, { email });

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        if (
            user.forgotPasswordToken &&
            user.forgotSendAt &&
            user.forgotSendAt + 60 * 60 * 1000 > Date.now()
        )
            throw new HttpException(
                'You can only request a password reset once every 1 hours',
                HttpStatus.BAD_REQUEST,
            );

        const token = uuidv4();

        await Repository.updateById(UserEntity, user.id, {
            forgotPasswordToken: token,
            forgotSendAt: Date.now(),
        });

        const generatedToken =
            await this.oneTimeTokenService.createOneTimeToken(
                user.id,
                ETokenType.PASSWORD_RESET,
                Date.now() + 60 * 60 * 1000,
                {
                    token: token,
                },
            );

        await this.emailService.sendEmail(
            'emailForgotPassword',
            user.email,
            'Reset Your Password',
            'Forgot Password',
            user.id,
            {
                title: 'Reset Your Password',
                resetLink: generatedToken,
            },
        );

        return { message: 'Reset password email sent successfully' };
    }

    /**
     * Change the password by link
     * @param userId - The ID of the user to change the password
     * @param password - The new password
     * @returns The message of the operation
     */
    public async changePasswordByLink(
        userId: string,
        email: string,
        password: string,
        req: any,
    ) {
        const UserEntity = Repository.getEntity('UserEntity');
        const passwordHash = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        await Repository.updateById(UserEntity, userId, {
            password: passwordHash,
            forgotPasswordToken: null,
        });

        const recoverAccountURL =
            await this.oneTimeTokenService.createOneTimeToken(
                userId,
                ETokenType.RECOVER_ACCOUNT,
                Date.now() + 60 * 60 * 30 * 1000,
            );

        await this.emailService.sendEmail(
            'emailPasswordChanged',
            email,
            'Password Changed',
            'Password Changed',
            userId,
            {
                title: 'Password Changed',
                timestamp: new Date().toLocaleString(),
                ipAddress: req.ip,
                deviceInfo: req.headers['user-agent'],
                location:
                    req.ip === '127.0.0.1'
                        ? `localhost`
                        : await this.locationService.getLocation(req.ip),
                securityLink: recoverAccountURL,
            },
        );

        return true;
    }

    /**
     * Unsubscribe from newsletter
     * @param email - The email of the user to unsubscribe
     * @returns The message of the operation
     */
    public async unsubscribeNewsletter(email: string) {
        const UserEntity = Repository.getEntity('UserEntity');
        const user = await Repository.findOne(UserEntity, { email });

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        await Repository.updateById(UserEntity, user.id, {
            unsubscribe: true,
        });

        return { message: 'Newsletter unsubscribed successfully' };
    }

    /* Block */

    /**
     * Block a user
     * @param userId - The ID of the user to block
     * @returns The message of the operation
     */
    public async blockUser(userId: string): Promise<{ message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');

        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        if (user.blocked) {
            throw new HttpException(
                'User is already blocked',
                HttpStatus.BAD_REQUEST,
            );
        }

        const result = await Repository.update(UserEntity, userId, {
            blocked: true,
        });

        if (result <= 0) {
            throw new HttpException(
                'Failed to block user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'User blocked successfully' };
    }

    /**
     * Unblock a user
     * @param userId - The ID of the user to unblock
     * @returns The message of the operation
     */
    public async unblockUser(userId: string): Promise<{ message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');

        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        if (!user.blocked) {
            throw new HttpException(
                'User is already unblocked',
                HttpStatus.BAD_REQUEST,
            );
        }

        const result = await Repository.update(UserEntity, userId, {
            blocked: false,
        });

        if (result <= 0) {
            throw new HttpException(
                'Failed to unblock user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'User unblocked successfully' };
    }

    /* Groups */
    @Resolver('user-groups')
    public static async resolveGroups(user: any) {
        const GroupsEntity = Repository.getEntity('GroupsEntity');
        const Groups: any = Application.getModel('Groups');
        let groupsToAssign = Array.isArray(user.groups)
            ? user.groups
            : [user.groups];

        groupsToAssign = groupsToAssign.filter((item) => item);

        if (groupsToAssign.length > 0) {
            const groups = await Repository.findAll(
                GroupsEntity,
                Repository.queryBuilder({
                    id: { $in: groupsToAssign },
                }),
            );

            let roles = new Set<string>(user.roles ?? []);
            const groupsModels = Groups.fromEntities(groups.data);
            groupsModels.map((group) =>
                group.roles?.map((roleName) => roles.add(roleName)),
            );
            user.groups = groupsModels;
            user.roles = Array.from(roles);
        }

        return user;
    }

    /**
     * Assign groups to a user
     * @param userId - The ID of the user to assign groups to
     * @param groupsInput - The groups to assign
     * @returns The message of the operation
     */
    public async assignGroupsToUser(
        userId: string,
        groupsInput: string | string[],
    ): Promise<{ message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const GroupsEntity = Repository.getEntity('GroupsEntity');
        const user = await Repository.findBy(UserEntity, { id: userId });

        if (!user)
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const groupsToAssign = Array.isArray(groupsInput)
            ? groupsInput
            : [groupsInput];

        const validGroups = await Repository.findAll(
            GroupsEntity,
            Repository.queryBuilder({
                id: { $in: groupsToAssign },
            }),
        );

        const validGroupIds = validGroups.data.map((group) => group.id);
        const invalidGroups = groupsToAssign.filter(
            (groupId) => !validGroupIds.includes(groupId),
        );

        if (invalidGroups.length > 0) {
            throw new HttpException(
                `Invalid groups: ${invalidGroups.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const updatedGroups = Array.from(
            new Set([...(user.groups || []), ...validGroupIds]),
        );

        const result = await Repository.updateById(UserEntity, userId, {
            groups: updatedGroups,
        });

        if (!result) {
            throw new HttpException(
                'Failed to assign groups to user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'Groups assigned to user successfully' };
    }

    /**
     * Remove groups from a user
     * @param userId - The ID of the user to remove groups from
     * @param groupsInput - The groups to remove
     * @returns The message of the operation
     */
    public async removeGroupsFromUser(
        userId: string,
        groupsInput: string | string[],
    ): Promise<{ success: boolean; message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const GroupsEntity = Repository.getEntity('GroupsEntity');
        const user = await Repository.findBy(UserEntity, { id: userId });

        if (!user)
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const groupsToRemove = Array.isArray(groupsInput)
            ? groupsInput
            : [groupsInput];

        const validGroups = await Repository.findAll(
            GroupsEntity,
            Repository.queryBuilder({
                id: { $in: groupsToRemove },
            }),
        );

        const validGroupIds = validGroups.data.map((group) => group.id);

        const invalidGroups = groupsToRemove.filter(
            (groupId) => !validGroupIds.includes(groupId),
        );

        if (invalidGroups.length > 0) {
            throw new HttpException(
                `Invalid groups: ${invalidGroups.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const updatedGroups = (user.groups || []).filter(
            (groupId) => !validGroupIds.includes(groupId),
        );

        const result = await Repository.updateById(UserEntity, userId, {
            groups: updatedGroups,
        });

        if (!result) {
            throw new HttpException(
                'Failed to remove groups from user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return {
            success: true,
            message: 'Groups removed from user successfully',
        };
    }

    // GraphQL Handlers
    public async handlerBlockUser(payload: { userId: string }, req: any) {
        const result = await this.blockUser(payload.userId);
        return {
            success: true,
            message: result.message,
        };
    }

    public async handlerUnblockUser(payload: { userId: string }, req: any) {
        const result = await this.unblockUser(payload.userId);
        return {
            success: true,
            message: result.message,
        };
    }

    public async handlerAssignGroupsToUser(
        payload: { userId: string; groups: string | string[] },
        req: any,
    ) {
        const result = await this.assignGroupsToUser(
            payload.userId,
            payload.groups,
        );
        return {
            success: true,
            message: result.message,
        };
    }

    public async handlerRemoveGroups(
        payload: { userId: string; groups: string | string[] },
        req: any,
    ) {
        const result = await this.removeGroupsFromUser(
            payload.userId,
            payload.groups,
        );
        return result;
    }
}

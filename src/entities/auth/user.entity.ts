/**                                                                               
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually, 
    as it may be overwritten by the application.
    **********************************************
**/

import {
    Entity,
    ObjectIdColumn,
    Column,
    Index,
    ObjectId,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from '@cmmv/repository';

import { IUser } from '@models/auth/user.model';

import { GroupsEntity } from '@entities/auth/groups.entity';

@Entity('auth_users')
@Index('idx_user_username', ['username'], { unique: true })
@Index('idx_user_provider', ['provider'])
@Index('idx_user_blocked', ['blocked'])
@Index('idx_user_validated', ['validated'])
@Index('idx_user_login', ['username', 'password', 'blocked'])
export class UserEntity implements IUser {
    @ObjectIdColumn()
    _id: ObjectId;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    username: string;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    password: string;

    @Column({
        type: 'varchar',
        nullable: true,
    })
    provider?: string;

    @ManyToOne(() => GroupsEntity, (groups) => groups._id, { nullable: false })
    @Column({
        type: 'simple-array',
        nullable: true,
    })
    groups?: GroupsEntity[] | string[] | ObjectId[] | null;

    @Column({
        type: 'simple-array',
        default: [],
        nullable: true,
    })
    roles?: string[];

    @Column({
        type: 'boolean',
        default: false,
        nullable: false,
    })
    root: boolean;

    @Column({
        type: 'boolean',
        default: false,
        nullable: false,
    })
    blocked: boolean;

    @Column({
        type: 'boolean',
        default: false,
        nullable: false,
    })
    validated: boolean;

    @Column({
        type: 'boolean',
        default: false,
        nullable: false,
    })
    verifyEmail: boolean;

    @Column({
        type: 'int',
        nullable: true,
    })
    verifyEmailCode?: number;

    @Column({
        type: 'boolean',
        default: false,
        nullable: false,
    })
    verifySMS: boolean;

    @Column({
        type: 'int',
        nullable: true,
    })
    verifySMSCode?: number;

    @Column({
        type: 'varchar',
        nullable: true,
    })
    optSecret?: string;

    @Column({
        type: 'boolean',
        default: false,
        nullable: false,
    })
    optSecretVerify: boolean;

    @Column({
        type: 'varchar',
        default: '{}',
        nullable: true,
    })
    profile?: string;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;
}

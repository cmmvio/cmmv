/**                                                                               
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually, 
    as it may be overwritten by the application.
    **********************************************
**/

import { Entity, ObjectIdColumn, Column, Index, ObjectId } from 'typeorm';

import { IRoles } from '../../models/auth/roles.model';

@Entity('roles')
@Index('idx_roles_name', ['name'], { unique: true })
export class RolesEntity implements IRoles {
    @ObjectIdColumn()
    _id: ObjectId;

    @Column({ type: 'varchar' })
    name: string;
}

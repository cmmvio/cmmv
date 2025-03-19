/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
} from '@cmmv/repository';

import { II18NCountries } from '@models/i18n/i18ncountries.model';

@Entity('i18n-countries')
@Index('idx_i18ncountries_name', ['name'], { unique: true })
@Index('idx_i18ncountries_iso', ['iso'])
export class I18NCountriesEntity implements II18NCountries {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        nullable: true,
    })
    name?: string;

    @Column({
        type: 'varchar',
        nullable: true,
    })
    iso?: string;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    alpha3: string;

    @Column({
        type: 'int',
        nullable: false,
    })
    numeric: number;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    ddi: string;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    phoneMask: string;

    @CreateDateColumn({
        type: 'datetime',
        nullable: false,
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'datetime',
        nullable: true,
    })
    updatedAt: Date;
}

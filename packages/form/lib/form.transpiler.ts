import * as fs from 'node:fs';
import * as path from 'node:path';

import { Application, Config, ITranspile, Logger, Module } from '@cmmv/core';

import { FormRegistry } from './form.registry';

export class FormTranspile implements ITranspile {
    private logger: Logger = new Logger('FormTranspile');

    run(): void {
        //console.log(FormRegistry.getForms());
    }
}

import { Module } from '@cmmv/core';

import { FormConfig } from './form.config';
import { FormTranspile } from './form.transpiler';

export const FormModule = new Module('form', {
    configs: [FormConfig],
    transpilers: [FormTranspile],
});

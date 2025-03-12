import { Module } from '@cmmv/core';

import { HTTPConfig } from './http.config';
import { ViewConfig } from './view.config';
import { DefaultHTTPTranspiler } from '../transpilers/default.transpiler';
import { ViewTranspile } from '../transpilers/view.transpile';

export const DefaultHTTPModule = new Module('http', {
    configs: [HTTPConfig, ViewConfig],
    transpilers: [DefaultHTTPTranspiler, ViewTranspile],
});

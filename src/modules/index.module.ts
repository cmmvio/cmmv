import { Module } from '@cmmv/core';
import { IndexController } from '../controllers/index.controller';

export let IndexModule = new Module('index', {
    controllers: [IndexController],
});

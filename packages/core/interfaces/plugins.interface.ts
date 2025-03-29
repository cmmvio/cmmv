import { AbstractContract } from '../abstracts';

export interface IPlugin {
    name: string;
    version: string;
    description: string;
    api?: new () => any;
    admin?: IPluginAdmin;
    clients?: IPluginClient;
    contracts?: IPluginContract;
    dependencies: string[];
}

export interface IPluginContract {
    [key: string]: new () => AbstractContract;
}

export interface IPluginClient {
    vue?: any;
    react?: any;
    angular?: any;
    svelte?: any;
    solid?: any;
    qwik?: any;
    solidjs?: any;
}

export interface IPluginAdmin {
    navbav?: { [key: string]: INavbarItem };
}

export interface INavbarItem {
    route: string;
    contract?: string;
    view?: string;
}

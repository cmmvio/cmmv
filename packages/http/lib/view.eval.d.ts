export declare const evaluate: (scope: any, exp: string, el?: Node) => any;
export declare const evaluateAsync: (scope: any, exp: string, el?: Node) => Promise<any>;
export declare const execute: (scope: any, exp: string, el?: Node) => any;
export declare const toFunction: (exp: string) => Function;

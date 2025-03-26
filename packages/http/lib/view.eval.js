"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFunction = exports.execute = exports.evaluateAsync = exports.evaluate = void 0;
const evalCache = Object.create(null);
const evaluate = (scope, exp, el) => (0, exports.execute)(scope, `return(${exp})`, el);
exports.evaluate = evaluate;
const evaluateAsync = async (scope, exp, el) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await (0, exports.evaluate)(scope, exp, el);
            resolve(result);
        }
        catch (error) {
            console.error('Error evaluating expression:', exp, error);
            reject(`Evaluation error: ${error.message}`);
        }
    });
};
exports.evaluateAsync = evaluateAsync;
const execute = (scope, exp, el) => {
    const fn = evalCache[exp] || (evalCache[exp] = (0, exports.toFunction)(exp));
    try {
        return fn(scope, el);
    }
    catch (e) {
        //console.error(e);
    }
};
exports.execute = execute;
const toFunction = (exp) => {
    try {
        return new Function(`$data`, `$el`, `with($data){${exp}}`);
    }
    catch (e) {
        console.error(`${e.message} in expression: ${exp}`);
        return () => { };
    }
};
exports.toFunction = toFunction;

const evalCache: Record<string, Function> = Object.create(null);

/**
 * Evaluate an expression
 * @param scope - The scope
 * @param exp - The expression
 * @param el - The element
 * @returns The result
 */
export const evaluate = (scope: any, exp: string, el?: Node) =>
    execute(scope, `return(${exp})`, el);

/**
 * Evaluate an expression asynchronously
 * @param scope - The scope
 * @param exp - The expression
 * @param el - The element
 * @returns The result
 */
export const evaluateAsync = async (
    scope: any,
    exp: string,
    el?: Node,
): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await evaluate(scope, exp, el);
            resolve(result);
        } catch (error) {
            console.error('Error evaluating expression:', exp, error);
            reject(`Evaluation error: ${error.message}`);
        }
    });
};

/**
 * Execute an expression
 * @param scope - The scope
 * @param exp - The expression
 * @param el - The element
 * @returns The result
 */
export const execute = (scope: any, exp: string, el?: Node) => {
    const fn = evalCache[exp] || (evalCache[exp] = toFunction(exp));

    try {
        return fn(scope, el);
    } catch (e) {
        //console.error(e);
    }
};

export const toFunction = (exp: string): Function => {
    try {
        return new Function(`$data`, `$el`, `with($data){${exp}}`);
    } catch (e) {
        console.error(`${(e as Error).message} in expression: ${exp}`);
        return () => {};
    }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssrDirectives = exports.extractSetupScript = exports.i18n = exports.sServerData = exports.sAttr = exports.sData = exports.ssrLoadData = void 0;
const fs = require("fs");
const path = require("path");
const core_1 = require("@cmmv/core");
const view_utils_1 = require("./view.utils");
const view_eval_1 = require("./view.eval");
const ssrLoadData = async (templateText, data, template) => {
    const sDirectiveRegex = /\s+s:([\w\d_]+)\s*=\s*[""]([^""]+)[""]/g;
    let match;
    while ((match = sDirectiveRegex.exec(templateText)) !== null) {
        const [fullMatch, variableName, expression] = match;
        try {
            const result = await (0, view_eval_1.evaluateAsync)(data, expression);
            template.setContext(variableName, result);
            templateText = templateText.replace(fullMatch, '');
        }
        catch (error) {
            console.error(`Error evaluating expression "${expression}":`, error);
        }
    }
    return templateText;
};
exports.ssrLoadData = ssrLoadData;
const sData = async (templateText, data, template) => {
    return templateText.replace(/<([^>]+)\s([^>]+)s-data=[""](.+?)[""]([^>]*)>(.*?)<\/\1>/g, (match, tagName, attributesBefore, key, attributesAfter, innerHTML) => {
        const value = (0, view_utils_1.getValueFromKey)(data, key.trim());
        if (value !== undefined)
            return `<${tagName} ${attributesBefore} ${attributesAfter}>${value}</${tagName}>`;
        else
            return `<!-- s-data not found: ${key} -->`;
    });
};
exports.sData = sData;
const sAttr = (templateText, data, template) => {
    return templateText.replace(/<([^>]+)\s+s-attr=[""](.+?)[""]([^>]*)>/g, (match, tagName, key, attributes) => {
        const value = (0, view_utils_1.getValueFromKey)(data, key.trim());
        if (value !== undefined)
            return `<${tagName} ${attributes} ${key}="${value}">`;
        else
            return `<!-- s-attr not found: ${key} -->`;
    });
};
exports.sAttr = sAttr;
const sServerData = (templateText, data, template) => {
    return templateText.replace(/\{(\w+)\}/g, (match, key) => {
        const value = (0, view_utils_1.getValueFromKey)(data, key.trim());
        return value !== undefined ? value : '';
    });
};
exports.sServerData = sServerData;
// I18n
function loadLocaleFile(locale) {
    try {
        const localePath = path.resolve(process.cwd(), core_1.Config.get('i18n.localeFiles'), `${locale}.json`);
        if (fs.existsSync(localePath)) {
            const fileContent = fs.readFileSync(localePath, 'utf-8');
            return JSON.parse(fileContent);
        }
    }
    catch { }
    return {};
}
const i18n = (templateText, data, template) => {
    const locale = data.locale || core_1.Config.get('i18n.default') || 'en';
    const translations = loadLocaleFile(locale);
    return templateText.replace(/<(\w+)([^>]*)\s+s-i18n=[""](.+?)[""]([^>]*)>(.*?)<\/\1>/g, (match, tagName, beforeAttrs, key, afterAttrs, innerHTML) => {
        const translation = (0, view_utils_1.getValueFromKey)(translations, key?.trim());
        if (translation)
            return `<${tagName}${beforeAttrs}${afterAttrs}>${translation}</${tagName}>`;
        else
            return `<!-- s-i18n not found: ${key} -->`;
    });
};
exports.i18n = i18n;
//Layout
async function resolveImport(filename) {
    try {
        const resolvedFilename = path.resolve(process.cwd(), 'public', filename);
        if (filename.endsWith('.cmmv') && fs.existsSync(resolvedFilename)) {
            const src = fs.readFileSync(resolvedFilename, 'utf-8');
            const templateMatch = src.match(/<template>([\s\S]*?)<\/template>/);
            const scriptMatch = src.match(/<script.*?>([\s\S]*?)<\/script>/);
            const styleMatch = src.match(/<style.*?>([\s\S]*?)<\/style>/);
            const importRegex = /import\s+([^;]+?)\s+from\s+[""]([^""]+)[""];/g;
            const importMatch = src.match(/import\s+([^;]+?)\s+from\s+[""]([^""]+)[""];/g);
            const template = templateMatch ? templateMatch[1].trim() : '';
            const style = styleMatch ? styleMatch[1].trim() : '';
            let scriptContent = scriptMatch ? scriptMatch[1].trim() : '';
            const imports = {};
            scriptContent.replace(importRegex, (_, imported, from) => {
                const filename = from
                    .replace('./', './view')
                    .replace('@/', './components/')
                    .replace('@components/', './components/');
                imported.split(',').forEach(async (part) => {
                    const cleanedImport = part.trim();
                    if (cleanedImport.startsWith('{')) {
                        const destructured = cleanedImport
                            .replace(/[{}]/g, '')
                            .split(',')
                            .map((name) => `${name.trim()}: ${name.trim()}`)
                            .join(', ');
                        imports[destructured] = await resolveImport(filename);
                    }
                    else {
                        imports[cleanedImport] = await resolveImport(filename);
                    }
                });
                return '';
            });
            const componentObjectString = Object.keys(imports)
                .map((key) => `${key}: ${imports[key]}`)
                .join(', ');
            if (scriptContent.includes('export default')) {
                scriptContent = scriptContent
                    .replace(importRegex, '')
                    .replace(/export default\s*{([\s\S]*?)}/, `{ template: \`${template}\`, components: { ${componentObjectString} },  styles: \`${style}\`, $1 }`);
                //
            }
            return scriptContent;
        }
        else if (filename.endsWith('.vue') &&
            fs.existsSync(resolvedFilename)) {
            const src = fs.readFileSync(resolvedFilename, 'utf-8');
            const templateMatch = src.match(/<template>([\s\S]*?)<\/template>/);
            const scriptMatch = src.match(/<script.*?>([\s\S]*?)<\/script>/);
            const styleMatch = src.match(/<style.*?>([\s\S]*?)<\/style>/);
            const template = templateMatch ? templateMatch[1].trim() : '';
            const style = styleMatch ? styleMatch[1].trim() : '';
            let scriptContent = scriptMatch ? scriptMatch[1].trim() : '';
            if (scriptContent.includes('export default')) {
                scriptContent = scriptContent.replace(/export default\s*{([\s\S]*?)}/, (_, body) => {
                    return `
                            {
                                template: \`${template}\`,
                                styles: \`${style}\`,
                                ${body.trim()}
                            }
                        `;
                });
            }
            return scriptContent;
        }
        else {
            const content = await Promise.resolve(`${filename}`).then(s => require(s));
            return content;
        }
    }
    catch {
        return 'null';
    }
}
const extractSetupScript = async (templateText) => {
    const regex = /<script\s+[^>]*s-setup[^>]*>([\s\S]*?)<\/script>/;
    const importRegex = /import\s+([^;]+?)\s+from\s+[""]([^""]+)[""];/g;
    const scriptMatch = templateText.match(regex);
    let scriptObject = null;
    if (scriptMatch) {
        const scriptContent = scriptMatch[1].trim();
        let imports = '';
        try {
            scriptContent.replace(importRegex, (_, imported, from) => {
                const filename = from
                    .replace('./', './view')
                    .replace('@/', './components/')
                    .replace('@components/', './components/');
                imported.split(',').forEach(async (part) => {
                    const cleanedImport = part.trim();
                    if (cleanedImport.startsWith('{')) {
                        const destructured = cleanedImport
                            .replace(/[{}]/g, '')
                            .split(',')
                            .map((name) => `${name.trim()}: ${name.trim()}`)
                            .join(', ');
                        imports += `const { ${destructured} } = ${await resolveImport(filename)};\n`;
                    }
                    else {
                        imports += `const ${cleanedImport} = ${await resolveImport(filename)};\n`;
                    }
                });
                return '';
            });
            const processedScript = scriptContent
                .replace(importRegex, '')
                .replace(/export\s+default\s+/, '')
                .replace(/module\.exports\s*=/, '');
            const scriptFunction = new Function(`${imports} return (${processedScript});`);
            scriptObject = scriptFunction();
            if (scriptObject &&
                typeof scriptObject === 'object' &&
                scriptObject.default)
                return scriptObject.default;
        }
        catch (e) {
            console.error(e);
        }
    }
    if (scriptObject) {
        return {
            html: templateText.replace(regex, () => `<!-- setup -->`),
            setup: scriptObject,
        };
    }
    else {
        return templateText.replace(regex, () => `<!-- setup -->`);
    }
};
exports.extractSetupScript = extractSetupScript;
//SSR
async function forSSR(templateText, template) {
    const forDirectiveRegex = /<(\w[-\w]*)([^>]*)\s+(c-for)\s*=\s*[""](.*?)[""]([^>]*)>(.*?)<\/\1>/gs;
    const attrDirectiveRegex = /\s+(c-text|c-html|:ref)\s*=\s*[""]([^""]+)[""]/g;
    const placeholder = 'c-ssr-for';
    let match;
    while ((match = forDirectiveRegex.exec(templateText)) !== null) {
        const [fullMatch, tagName, beforeAttrs, directive, exp, afterAttrs, innerHTML,] = match;
        const [_, variables] = exp.match(/^\s*\(([^)]+)\)\s+in\s+|^\s*([^ ]+)\s+of\s+/) || [];
        const [itemVar, keyVar] = variables
            ? variables.split(',').map((v) => v.trim())
            : [variables, null];
        const listName = exp.match(/\b(?:in|of)\s+([^\s""]+)/i)?.[1];
        const context = template.getContext();
        const items = listName ? (0, view_utils_1.getValueFromKey)(context, listName) : null;
        const renderTagMatch = /render-tag\s*=\s*[""]([^""]+)[""]/i.exec(fullMatch);
        const renderTag = renderTagMatch ? renderTagMatch[1] : 'div';
        let renderedItems = '';
        if (Array.isArray(items)) {
            for (const item of items) {
                const itemData = { ...context, [itemVar]: item };
                if (keyVar)
                    itemData[keyVar] = items.indexOf(item);
                const itemHTML = innerHTML.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
                    return (0, view_utils_1.getValueFromKey)(itemData, key);
                });
                const beforeAttrsParsed = beforeAttrs.replace(/render-tag\s*=\s*[""]([^""]+)[""]/i, '');
                const afterAttrsParsed = afterAttrs.replace(/render-tag\s*=\s*[""]([^""]+)[""]/i, '');
                renderedItems += `<${renderTag}${beforeAttrsParsed}${afterAttrsParsed}>${itemHTML}</${renderTag}>`;
            }
        }
        renderedItems = renderedItems.replace(attrDirectiveRegex, (fullMatch, directive, expression) => {
            const value = (0, view_utils_1.getValueFromKey)(template.getContext(), expression);
            switch (directive) {
                case 'c-text':
                    return fullMatch.replace(expression, value);
                case 'c-html':
                    return fullMatch.replace(expression, value);
                case ':ref':
                    return fullMatch.replace(expression, value);
                default:
                    return fullMatch;
            }
        });
        templateText = templateText.replace(fullMatch, `
            <div c-if="!loaded && !${listName}">${renderedItems}</div>
            <div c-else>${fullMatch
            .replace(new RegExp(`(<\\/?\\s*)${tagName}(\\s*>)`, 'gi'), `$1${renderTag}$2`)
            .replace(/render-tag\s*=\s*[""]([^""]+)[""]/i, '')
            .replace(directive, placeholder)}</div>
            `);
        break;
    }
    templateText = templateText.replace(new RegExp(placeholder, 'g'), 'c-for');
    return templateText;
}
async function ifSSR(templateText, data) {
    const sIfRegex = /<s-if\s+exp=[""]([^""]+)[""]>(.*?)<\/s-if>/gs;
    const sElseRegex = /<s-else>(.*?)<\/s-else>/gs;
    return templateText.replace(sIfRegex, (match, exp, innerHTML) => {
        const condition = (0, view_eval_1.evaluate)(data, exp);
        if (condition) {
            return innerHTML.replace(sElseRegex, '');
        }
        else {
            const elseMatch = sElseRegex.exec(templateText);
            if (elseMatch)
                return elseMatch[1];
            else
                return '';
        }
    });
}
const ssrDirectives = async (templateText, data, template) => {
    let parsedTemplateText = await ifSSR(templateText, template.getContext());
    parsedTemplateText = await forSSR(parsedTemplateText, template);
    return parsedTemplateText;
};
exports.ssrDirectives = ssrDirectives;

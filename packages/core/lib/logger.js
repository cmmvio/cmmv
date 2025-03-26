"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const hooks_1 = require("./hooks");
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "ERROR";
    LogLevel["WARNING"] = "WARNING";
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["VERBOSE"] = "VERBOSE";
    LogLevel["INFO"] = "INFO";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(context) {
        this.applicationContext = 'Server';
        this.defaultContext = 'Server';
        this.emitLog = null;
        this.context = context || this.defaultContext;
    }
    formatDate() {
        const date = new Date();
        return this.colorWhite(date.toLocaleString('en-US', {
            dateStyle: 'short',
            timeStyle: 'medium',
        }));
    }
    formatMessage(level, message, context) {
        if (this.emitLog === null && process.env.NODE_ENV !== 'test') {
            const { Config } = require('./config'); //@ts-ignore
            this.emitLog = Config.get('logger.emitLog', true);
        }
        if (this.emitLog) {
            hooks_1.Hooks.execute(hooks_1.HooksType.Log, {
                level,
                message,
                context: context || this.context,
                timestamp: Date.now(),
            });
        }
        const timestamp = this.formatDate();
        const levelColored = this.getLevelColor(level);
        const contextName = context || this.context;
        const contextColored = this.colorYellow(`[${contextName}]`);
        const messageColored = this.getMessageColor(level)(message);
        const applicationContextColored = this.getMessageColor(level)(`[${this.applicationContext}] -`);
        return `${applicationContextColored} ${timestamp} ${levelColored} ${contextColored} ${messageColored}`;
    }
    getLevelColor(level) {
        switch (level.toUpperCase()) {
            case 'ERROR':
                return this.colorRed(level.toUpperCase());
            case 'WARNING':
                return this.colorOrange(level.toUpperCase());
            case 'DEBUG':
                return this.colorBlue(level.toUpperCase());
            case 'VERBOSE':
                return this.colorCyan(level.toUpperCase());
            default:
                return this.colorGreen(level.toUpperCase());
        }
    }
    getMessageColor(level) {
        switch (level.toUpperCase()) {
            case 'ERROR':
                return this.colorRed;
            case 'WARNING':
                return this.colorOrange;
            case 'DEBUG':
                return this.colorBlue;
            case 'VERBOSE':
                return this.colorCyan;
            default:
                return this.colorGreen;
        }
    }
    colorRed(text) {
        return `\x1b[31m${text}\x1b[0m`;
    }
    colorGreen(text) {
        return `\x1b[32m${text}\x1b[0m`;
    }
    colorYellow(text) {
        return `\x1b[33m${text}\x1b[0m`;
    }
    colorBlue(text) {
        return `\x1b[34m${text}\x1b[0m`;
    }
    colorCyan(text) {
        return `\x1b[36m${text}\x1b[0m`;
    }
    colorWhite(text) {
        return `\x1b[37m${text}\x1b[0m`;
    }
    colorOrange(text) {
        return `\x1b[38;5;214m${text}\x1b[0m`;
    }
    log(message, context) {
        console.log(this.formatMessage('LOG', message, context));
    }
    error(message, context) {
        console.error(this.formatMessage('ERROR', message, context));
    }
    warning(message, context) {
        console.warn(this.formatMessage('WARNING', message, context));
    }
    debug(message, context) {
        console.debug(this.formatMessage('DEBUG', message, context));
    }
    verbose(message, context) {
        console.log(this.formatMessage('VERBOSE', message, context));
    }
}
exports.Logger = Logger;

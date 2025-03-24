import { Hooks, HooksType } from './hooks';

export enum LogLevel {
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    DEBUG = 'DEBUG',
    VERBOSE = 'VERBOSE',
    INFO = 'INFO',
}

export interface LogEvent {
    level: LogLevel;
    message: string;
    context: string;
    timestamp: number;
    event?: any;
    metadata?: any;
}

export class Logger {
    protected applicationContext: string = 'Server';
    protected defaultContext: string = 'Server';
    private context: string;
    private emitLog = null;

    constructor(context?: string) {
        this.context = context || this.defaultContext;
    }

    private formatDate(): string {
        const date = new Date();
        return this.colorWhite(
            date.toLocaleString('en-US', {
                dateStyle: 'short',
                timeStyle: 'medium',
            }),
        );
    }

    private formatMessage(
        level: string,
        message: string,
        context?: string,
    ): string {
        if (this.emitLog === null && process.env.NODE_ENV !== 'test') {
            const { Config } = require('./config'); //@ts-ignore
            this.emitLog = Config.get<boolean>('logger.emitLog', true);
        }

        if (this.emitLog) {
            Hooks.execute(HooksType.Log, {
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
        const applicationContextColored = this.getMessageColor(level)(
            `[${this.applicationContext}] -`,
        );
        return `${applicationContextColored} ${timestamp} ${levelColored} ${contextColored} ${messageColored}`;
    }

    private getLevelColor(level: string): string {
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

    private getMessageColor(level: string): (text: string) => string {
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

    private colorRed(text: string): string {
        return `\x1b[31m${text}\x1b[0m`;
    }

    private colorGreen(text: string): string {
        return `\x1b[32m${text}\x1b[0m`;
    }

    private colorYellow(text: string): string {
        return `\x1b[33m${text}\x1b[0m`;
    }

    private colorBlue(text: string): string {
        return `\x1b[34m${text}\x1b[0m`;
    }

    private colorCyan(text: string): string {
        return `\x1b[36m${text}\x1b[0m`;
    }

    private colorWhite(text: string): string {
        return `\x1b[37m${text}\x1b[0m`;
    }

    private colorOrange(text: string): string {
        return `\x1b[38;5;214m${text}\x1b[0m`;
    }

    public log(message: string, context?: string): void {
        console.log(this.formatMessage('LOG', message, context));
    }

    public error(message: string, context?: string): void {
        console.error(this.formatMessage('ERROR', message, context));
    }

    public warning(message: string, context?: string): void {
        console.warn(this.formatMessage('WARNING', message, context));
    }

    public debug(message: string, context?: string): void {
        console.debug(this.formatMessage('DEBUG', message, context));
    }

    public verbose(message: string, context?: string): void {
        console.log(this.formatMessage('VERBOSE', message, context));
    }
}

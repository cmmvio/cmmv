export declare enum LogLevel {
    ERROR = "ERROR",
    WARNING = "WARNING",
    DEBUG = "DEBUG",
    VERBOSE = "VERBOSE",
    INFO = "INFO"
}
export interface LogEvent {
    level: LogLevel;
    message: string;
    context: string;
    timestamp: number;
    event?: any;
    metadata?: any;
}
export declare class Logger {
    protected applicationContext: string;
    protected defaultContext: string;
    private context;
    private emitLog;
    constructor(context?: string);
    private formatDate;
    private formatMessage;
    private getLevelColor;
    private getMessageColor;
    private colorRed;
    private colorGreen;
    private colorYellow;
    private colorBlue;
    private colorCyan;
    private colorWhite;
    private colorOrange;
    log(message: string, context?: string): void;
    error(message: string, context?: string): void;
    warning(message: string, context?: string): void;
    debug(message: string, context?: string): void;
    verbose(message: string, context?: string): void;
}

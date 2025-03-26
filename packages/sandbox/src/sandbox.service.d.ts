import { Logger, IContract } from '@cmmv/core';
export declare class SandboxService {
    static logger: Logger;
    static chokidar: any;
    static port: number;
    static clients: any[];
    static wsServer: any;
    /**
     * Define the public directory
     */
    definePublicDir(): void;
    /**
     * Load the config
     * @returns The success and message of the operation
     */
    static loadConfig(): Promise<void>;
    /**
     * Create the web socket
     */
    static createWebsocket(): void;
    /**
     * Broadcast the data to the clients
     * @param data - The data to broadcast
     */
    static broadcast(data: any): void;
    /**
     * Close the web socket
     */
    static closeWebsocket(): void;
    /**
     * Resolve the style
     * @returns The style
     */
    resolveStyle(): Promise<string>;
    /**
     * Get the web socket port
     * @returns The web socket port
     */
    getWebSocketPort(): number;
    /**
     * Compile the contract
     * @param schema - The schema of the contract
     * @returns The success and message of the operation
     */
    compileContract(schema: IContract): Promise<string>;
    /**
     * Delete the contract
     * @param contractName - The name of the contract to delete
     * @returns The success and message of the operation
     */
    deleteContract(contractName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Restart the application
     * @returns The success and message of the operation
     */
    restartApplication(): Promise<void>;
}

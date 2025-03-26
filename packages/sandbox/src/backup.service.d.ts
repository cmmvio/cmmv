export declare class BackupService {
    private logger;
    private readonly backupsDir;
    constructor();
    /**
     * Function to create a backup of the database
     * @returns {Promise<any>}
     */
    createBackup(): Promise<any>;
    /**
     * Function to get all entities
     * @returns {Array<any>}
     */
    private getAllEntities;
    /**
     * Function to backup an entity
     * @param entityInfo {Object}
     * @param backupDir {string}
     * @returns {Promise<any>}
     */
    private backupEntity;
    /**
     * Function to create a zip archive
     * @param sourceDir {string}
     * @param outputPath {string}
     * @returns {Promise<void>}
     */
    private createZipArchive;
    /**
     * Function to calculate the SHA256 hash of a file
     * @param filePath {string}
     * @returns {string}
     */
    private calculateSHA256;
    /**
     * Function to cleanup the temporary directory
     * @param dirPath {string}
     */
    private cleanupTempDir;
    /**
     * Function to list all backups
     * @returns {Promise<any[]>}
     */
    listBackups(): Promise<any[]>;
    /**
     * Function to download a backup file
     * @param filename {string}
     * @param res {any}
     * @returns {Promise<any>}
     */
    downloadBackupFile(filename: string, res: any): Promise<any>;
}

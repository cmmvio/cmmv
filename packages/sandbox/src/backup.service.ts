import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as archiver from 'archiver';
import * as fg from 'fast-glob';

import { Service } from '@cmmv/core';
import { Repository } from '@cmmv/repository';
import { Logger } from '@cmmv/core';

@Service('backup')
export class BackupService {
    private logger = new Logger('BackupService');
    private readonly backupsDir = path.join(
        __dirname.replace('src', 'backups'),
    );

    constructor() {
        if (!fs.existsSync(this.backupsDir))
            fs.mkdirSync(this.backupsDir, { recursive: true });
    }

    /**
     * Function to create a backup of the database
     * @returns {Promise<any>}
     */
    async createBackup(): Promise<any> {
        const timestamp = Date.now();
        const backupDirName = `backup-${timestamp}`;
        const currentBackupDir = path.join(this.backupsDir, backupDirName);

        fs.mkdirSync(currentBackupDir, { recursive: true });

        try {
            this.logger.log(`Iniciando backup em ${backupDirName}`);

            const stats = {
                startTime: new Date(),
                entitiesProcessed: 0,
                totalRecords: 0,
                errors: [],
                files: [],
            };

            const entities = this.getAllEntities();

            for (const entity of entities) {
                try {
                    const result = await this.backupEntity(
                        entity,
                        currentBackupDir,
                    );
                    stats.entitiesProcessed++;
                    stats.totalRecords += result.recordCount;
                    stats.files.push(result.fileName);

                    this.logger.log(
                        `Backup da entidade ${entity.name} concluído: ${result.recordCount} registros`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Erro ao fazer backup da entidade ${entity.name}: ${error.message}`,
                    );
                    stats.errors.push({
                        entity: entity.name,
                        error: error.message,
                    });
                }
            }

            const zipFileName = `backup-${timestamp}.zip`;
            const zipFilePath = path.join(this.backupsDir, zipFileName);

            await this.createZipArchive(currentBackupDir, zipFilePath);
            this.logger.log(`Arquivo ZIP criado: ${zipFileName}`);

            const fileHash = this.calculateSHA256(zipFilePath);

            const endTime = new Date();
            const metadata = {
                filename: zipFileName,
                timestamp,
                createdAt: stats.startTime.toISOString(),
                finishedAt: endTime.toISOString(),
                duration: endTime.getTime() - stats.startTime.getTime(),
                entityCount: entities.length,
                recordCount: stats.totalRecords,
                entities: entities.map((e) => e.name),
                sha256: fileHash,
                fileSize: fs.statSync(zipFilePath).size,
                errors: stats.errors,
            };

            const metaFilePath = path.join(
                this.backupsDir,
                `${zipFileName}.meta.json`,
            );
            fs.writeFileSync(
                metaFilePath,
                JSON.stringify(metadata, null, 2),
                'utf8',
            );
            this.cleanupTempDir(currentBackupDir);

            this.logger.log(`Backup concluído: ${zipFileName}`);

            return {
                success: true,
                filename: zipFileName,
                metadata,
            };
        } catch (error) {
            this.logger.error(
                `Erro crítico no processo de backup: ${error.message}`,
            );
            this.cleanupTempDir(currentBackupDir);
            throw error;
        }
    }

    /**
     * Function to get all entities
     * @returns {Array<any>}
     */
    private getAllEntities() {
        const instance = Repository.getInstance();
        const result = [];

        if (instance.dataSource && instance.dataSource.entityMetadatas) {
            instance.dataSource.entityMetadatas.forEach((metadata) => {
                result.push({
                    name: metadata.name,
                    target: metadata.target,
                    tableName: metadata.tableName,
                });
            });
        }

        return result;
    }

    /**
     * Function to backup an entity
     * @param entityInfo {Object}
     * @param backupDir {string}
     * @returns {Promise<any>}
     */
    private async backupEntity(
        entityInfo: { name: string; target: any; tableName: string },
        backupDir: string,
    ) {
        const { name, target, tableName } = entityInfo;
        const fileName = name.replace(/Entity$/, '').toLowerCase() + '.json';
        const filePath = path.join(backupDir, fileName);
        const repository = Repository.getRepository(target);

        const allRecords = [];
        let totalRecords = 0;

        let currentPage = 0;
        const pageSize = 1000;
        let hasMoreRecords = true;

        while (hasMoreRecords) {
            const offset = currentPage * pageSize;

            const queryResult = await Repository.findAll(target, {
                limit: pageSize,
                offset: offset,
            });

            if (
                queryResult &&
                queryResult.data &&
                queryResult.data.length > 0
            ) {
                allRecords.push(...queryResult.data);
                totalRecords += queryResult.data.length;
                currentPage++;

                this.logger.log(
                    `Entidade ${name}: processados ${totalRecords} registros...`,
                );
            } else {
                hasMoreRecords = false;
            }
        }

        fs.writeFileSync(filePath, JSON.stringify(allRecords, null, 2), 'utf8');

        return {
            entityName: name,
            tableName,
            recordCount: totalRecords,
            fileName,
        };
    }

    /**
     * Function to create a zip archive
     * @param sourceDir {string}
     * @param outputPath {string}
     * @returns {Promise<void>}
     */
    private createZipArchive(
        sourceDir: string,
        outputPath: string,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', {
                zlib: { level: 9 },
            });

            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    /**
     * Function to calculate the SHA256 hash of a file
     * @param filePath {string}
     * @returns {string}
     */
    private calculateSHA256(filePath: string): string {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    }

    /**
     * Function to cleanup the temporary directory
     * @param dirPath {string}
     */
    private cleanupTempDir(dirPath: string): void {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    }

    /**
     * Function to list all backups
     * @returns {Promise<any[]>}
     */
    async listBackups(): Promise<any[]> {
        if (!fs.existsSync(this.backupsDir)) {
            return [];
        }

        const metaFiles = await fg([
            path.resolve(this.backupsDir, '*.meta.json'),
        ]);

        return metaFiles
            .map((file) => {
                try {
                    const metaContent = fs.readFileSync(file, 'utf8');
                    return JSON.parse(metaContent);
                } catch (error) {
                    this.logger.error(
                        `Erro ao ler metadados do backup ${file}: ${error.message}`,
                    );
                    return null;
                }
            })
            .filter((meta) => meta !== null);
    }

    /**
     * Function to download a backup file
     * @param filename {string}
     * @param res {any}
     * @returns {Promise<any>}
     */
    async downloadBackupFile(filename: string, res: any): Promise<any> {
        if (
            filename.includes('..') ||
            filename.includes('/') ||
            filename.includes('\\')
        ) {
            return res.code(400).json({
                success: false,
                message: 'Invalid filename',
            });
        }

        const backupPath = path.join(this.backupsDir, filename);

        if (!fs.existsSync(backupPath)) {
            return res.code(404).json({
                success: false,
                message: 'Backup file not found',
            });
        }

        try {
            const stat = fs.statSync(backupPath);

            res.header('Content-Type', 'application/zip');
            res.header(
                'Content-Disposition',
                `attachment; filename="${filename}"`,
            );
            res.header('Content-Length', stat.size);

            const fileStream = fs.createReadStream(backupPath);

            fileStream.on('error', (err) => {
                this.logger.error(
                    `Error streaming backup file: ${err.message}`,
                );

                try {
                    if (!res.sent) {
                        res.code(500).json({
                            success: false,
                            message: 'Error streaming file',
                            error: err.message,
                        });
                    }
                } catch (e) {
                    this.logger.error(
                        `Could not send error response: ${e.message}`,
                    );
                }
            });

            return await new Promise<void>((resolve, reject) => {
                res.send(fileStream);

                fileStream.on('end', () => {
                    this.logger.log(`File download completed: ${filename}`);
                    resolve();
                });

                fileStream.on('error', (err) => {
                    this.logger.error(
                        `Error during download stream: ${err.message}`,
                    );
                    reject(err);
                });
            });
        } catch (error) {
            this.logger.error(
                `Error preparing backup download: ${error.message}`,
            );

            return res.code(500).json({
                success: false,
                message: 'Error preparing backup download',
                error: error.message,
            });
        }
    }
}

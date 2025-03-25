import { Controller, Get, Post, Param, Response } from '@cmmv/http';

import { Auth } from '@cmmv/auth';

import { BackupService } from './backup.service';

@Controller('backups')
export class BackupController {
    constructor(private readonly backupService: BackupService) {}

    @Post({ exclude: true })
    @Auth({ rootOnly: true })
    async createBackup() {
        try {
            const result = await this.backupService.createBackup();
            return {
                success: true,
                message: 'Backup created successfully',
                data: result.metadata,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error creating backup',
                error: error.message,
            };
        }
    }

    @Get({ exclude: true })
    @Auth({ rootOnly: true })
    async listBackups() {
        try {
            const backups = await this.backupService.listBackups();

            return {
                success: true,
                data: backups,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error listing backups',
                error: error.message,
            };
        }
    }

    @Get('download/:filename', { exclude: true })
    async downloadBackup(@Param('filename') filename: string, @Response() res) {
        try {
            return await this.backupService.downloadBackupFile(filename, res);
        } catch (error) {
            return res.code(500).json({
                success: false,
                message: 'Error downloading backup',
                error: error.message,
            });
        }
    }
}

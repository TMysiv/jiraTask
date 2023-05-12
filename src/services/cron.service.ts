import { Injectable } from '@nestjs/common';
import * as cron from 'node-cron';
import * as fs from 'fs';

@Injectable()
export class CronService {

    constructor() {
        this.scheduleCronJob();
    }

    private scheduleCronJob() {
        cron.schedule('0 23 * * *', () => {
            this.deleteFiles();
        });
    }

    private deleteFiles() {
        const folderPath = process.cwd()+ '/files';

        fs.readdir(folderPath, (err, files) => {
            if (err) {
                console.error('Error reading folder:', err);
                return;
            }
            files.forEach((file) => {
                fs.unlinkSync(`${folderPath}/${file}`);
                console.log(`File deleted: ${file}`);
            });
        });
    }
}

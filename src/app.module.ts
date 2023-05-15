import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import {CronService} from "./services/cron.service";

@Module({
  imports: [UploadModule],
  controllers: [],
  providers: [CronService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { XlsModule } from './xls/xls.module';
import {CronService} from "./services/cron.service";

@Module({
  imports: [XlsModule],
  controllers: [],
  providers: [CronService],
})
export class AppModule {}

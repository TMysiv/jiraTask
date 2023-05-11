import { Module } from '@nestjs/common';
import { XlsService } from './xls.service';
import { XlsController } from './xls.controller';

@Module({
  providers: [XlsService],
  controllers: [XlsController]
})
export class XlsModule {}

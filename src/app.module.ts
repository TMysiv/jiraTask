import { Module } from '@nestjs/common';
import { XlsModule } from './xls/xls.module';

@Module({
  imports: [XlsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

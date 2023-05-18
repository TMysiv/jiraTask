import { Module } from '@nestjs/common';
import { XlsService } from './xls.service';
import { UploadController } from './upload.controller';
import {PdfService} from "./pdf.service";

@Module({
  providers: [XlsService, PdfService],
  controllers: [UploadController],
})
export class UploadModule {}

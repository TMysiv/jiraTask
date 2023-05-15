import {Controller, Post, Req, StreamableFile, UploadedFile, UseInterceptors} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {XlsService} from "./xls.service";
import {Request} from "express";
import {PdfService} from "./pdf.service";

@Controller("upload")
export class UploadController {
    constructor(private  xlsService: XlsService, private pdfService: PdfService) {}

    @Post()
    @UseInterceptors(FileInterceptor("file"))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
        if (req.headers.authorization === 'xls'){
            const newFile = await this.xlsService.parseFile(file.buffer);
            return new StreamableFile(newFile);
        }else {
            const newFile = await this.pdfService.parseFile(file.buffer);
        }

    }
}

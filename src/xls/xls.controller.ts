import {Controller, Post, StreamableFile, UploadedFile, UseInterceptors} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {XlsService} from "./xls.service";

@Controller("upload")
export class XlsController {
    constructor(private readonly xlsService: XlsService) {}

    @Post()
    @UseInterceptors(FileInterceptor("file"))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const newFile = await this.xlsService.parseFile(file.buffer);
        return new StreamableFile(newFile);
    }
}

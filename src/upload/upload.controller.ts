import {Controller, Post, Req, StreamableFile, UploadedFile, UseInterceptors} from "@nestjs/common";
import {FileInterceptor} from "@nestjs/platform-express";
import {XlsService} from "./xls.service";
import {Request} from "express";

@Controller("upload")
export class UploadController {
    constructor(private xlsService: XlsService) {}

    @Post()
    @UseInterceptors(FileInterceptor("file"))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
        try {
            const extension = req.headers.authorization;
            const newFile = await this.xlsService.parseFile(file.buffer, extension);
            const type = newFile.path.slice(-3) as string;
            return new StreamableFile(newFile, {type});
        }catch (e) {
            console.log(e)
        }

    }
}

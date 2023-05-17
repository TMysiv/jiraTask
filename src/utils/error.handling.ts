import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        let message:string;
        let statusCode:number;

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            message = exception.getResponse() as string;
            httpAdapter.reply(ctx.getResponse(), message, statusCode);
        } else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Something went wrong';
            httpAdapter.reply(ctx.getResponse(), { statusCode, message, error: 'Bad Request' }, statusCode);
        }
    }
}


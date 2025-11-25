import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from 'src/modules/logger/logger.service';

// global exception filter that will log all exceptions, except the HttpException
// and store them in the logs folder in the server, and don't log the HttpException exception
// because it is a part of application flow in NestJS like
// (BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException, etc)
@Catch()
export class GlobalFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // we will don't log the HttpException exception (we don't need to log it)
    // because it is a part of application flow in NestJS
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();
      const normalized = // sometime the error response is a string or object(when you pass an object)
        typeof errorResponse === 'string'
          ? { message: errorResponse }
          : (errorResponse as Record<string, any>);
      // remove the error property to make the error schema is same for all exceptions
      const { error, ...rest } = normalized;
      response.status(status).json({
        status: 'error',
        statusCode: status,
        ...rest,
      });
      return;
    }
    // unhandled exception loged as error
    this.logger.error(
      `${request.method} ${request.url} ${exception?.toString()}`,
    );
    response.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';


@Catch(MongoServerError, MongooseError.ValidationError)
export class MongoExceptionFilter implements ExceptionFilter {
    catch(exception: MongoServerError | MongooseError.ValidationError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Database error';
        let errors = [];

        if (exception instanceof MongoServerError) {
            if (exception.code === 11000) {
                const field = Object.keys(exception.keyPattern)[0];
                message = `Duplicate value for field: ${field}`;
                statusCode = HttpStatus.CONFLICT;
            } else if (exception.code === 121) {
                message = 'Document validation failed';
                statusCode = HttpStatus.BAD_REQUEST;
            }
        } else if (exception instanceof MongooseError.ValidationError) {
            statusCode = HttpStatus.BAD_REQUEST;
            message = 'Validation failed';
            errors = Object.values(exception.errors).map(err => ({
                field: err.path,
                message: err.message,
            }));
        }

        response.status(statusCode).json({
            statusCode,
            message,
            ...(errors.length ? { errors } : {}),
        });
    }
}

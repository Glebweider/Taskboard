// src/main.ts

// ! lib
// nest
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

import { AppModule } from '@App/app.module';
import { GlobalExceptionFilter, MongoExceptionFilter } from '@Exceptions';
import { _getLocalIPAddress } from '@Utils';


async function bootstrap() {
	const port = process.env.SERVER_PORT || 5000;
	const host = _getLocalIPAddress();
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: process.env.CLIENT_HOST,
		credentials: true,
		methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	});

	app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', process.env.CLIENT_HOST);
		res.header('Access-Control-Allow-Credentials', 'true');
		res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE,OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

		if (req.method === 'OPTIONS') 
			return res.status(200).end();

		next();
	});


	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	app.use(cookieParser());
	app.useGlobalFilters(
		new GlobalExceptionFilter(),
		new MongoExceptionFilter()
	);
	app.setGlobalPrefix(process.env.SERVER_PREFIX);

	await app.listen(port, () => {
		Logger.log(`App is running on: http://${host}:${port}`, 'Start');
	});
}

bootstrap();

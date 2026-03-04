// src/google/google.module.ts

// ! lib
// nestjs
import { Module } from '@nestjs/common';

// google
import { GoogleService } from './google.service';
import { GoogleController } from './google.controller';


@Module({
	imports: [],
	controllers: [GoogleController],
	providers: [GoogleService],
	exports: [GoogleService]
})
export class GoogleModule {}

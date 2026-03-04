// src/google/google.controller.ts

// ! lib
// nest
import { Controller, Get, Param, Res } from '@nestjs/common';
// express
import { Response } from 'express';

// ! own
// interface
import { GoogleService } from './google.service';


@Controller('files')
export class GoogleController {
	constructor(private googleService: GoogleService) { }

	@Get(':id')
	async streamFile(@Param('id') id: string, @Res() res: Response) {
		const stream = await this.googleService.getFileStream(id);

		res.setHeader('Cache-Control', 'public, max-age=31536000');
		stream.pipe(res);
	}
}

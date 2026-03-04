// src/google/google.service.ts

// ! lib
// nestjs
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { drive_v3, google } from 'googleapis';
import { Readable } from 'stream';


@Injectable()
export class GoogleService {
	private oauth2Client: OAuth2Client;
	private drive: drive_v3.Drive;

	constructor() {
		Logger.log(`Init Authorization...`, 'GoogleService');

		this.oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI,
		);
		this.oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

		this.drive = google.drive({
			version: 'v3',
			auth: this.oauth2Client,
		});

		Logger.log(`Complete Authorization!`, 'GoogleService');
	}

	async uploadFile(buffer: Buffer, filename: string, mimeType?: string) {
		const detectedMime =
			mimeType || require('mime-types').lookup(filename) || 'application/octet-stream';

		const response = await this.drive.files.create({
			requestBody: {
				name: filename,
				mimeType: detectedMime,
			},
			media: {
				mimeType: detectedMime,
				body: Readable.from(buffer),
			},
			supportsAllDrives: true,
			fields: 'id',
		});

		return {
			id: response.data.id,
			publicUrl: `${process.env.SERVER_HOST}/${process.env.SERVER_PREFIX}/files/${response.data.id}`,
		};
	}

	async getFileStream(fileId: string) {
		const response = await this.drive.files.get(
			{
				fileId,
				alt: 'media',
				supportsAllDrives: true,
			},
			{ responseType: 'stream' }
		);

		return response.data;
	}

	async deleteFile(fileId: string) {
		try {
			await this.drive.files.delete({ fileId });

			return;
		} catch (error: any) {
			Logger.error(`Not delete file to GoogleDisk: ${error.message}`, 'GoogleService');
		}
	}

	async generatePublicUrlToFile(fileId: string) {
		try {
			await this.drive.permissions.create({
				fileId: fileId,
				requestBody: {
					role: 'reader',
					type: 'anyone'
				},
				supportsAllDrives: true,
			});

			const response = await this.drive.files.get({
				fileId: fileId,
				fields: 'webViewLink, webContentLink'
			})

			return response.data;
		} catch (error: any) {
			Logger.error(`Not generate public url to file GoogleDisk: ${error.message}`, 'GoogleService');
			throw new HttpException(`Google Drive generate public url error: ${error.message}`, HttpStatus.BAD_GATEWAY);
		}
	}
}

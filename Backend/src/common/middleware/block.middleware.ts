import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuthService } from '@Auth/auth.service';
import { IBanned } from '@Interfaces';

const bannedUsers: IBanned[] = [];

@Injectable()
export class BlockMiddleware implements NestMiddleware {
    constructor(
        private readonly authService: AuthService,
        @InjectModel('Banned') private bannedModel: Model<IBanned>
    ) {
        this.loadBannedUsers();
        setInterval(() => this.loadBannedUsers(), 5 * 60 * 1000);
    }

    private async loadBannedUsers() {
        try {
            const users = await this.bannedModel.find().lean();
            bannedUsers.length = 0;

            users.forEach(user => {
                bannedUsers.push({ discordId: user.discordId, ip: user.ip });
            });

            Logger.log(`Обновлён список забаненных пользователей. Всего: ${bannedUsers.length}`, 'BlockMiddleware');
        } catch (error) {
            Logger.error('Ошибка при загрузке забаненных пользователей', error, 'BlockMiddleware');
        }
    }

    async use(req: Request, res: Response, next: NextFunction) {
        const token = req.cookies?.jwt;

        if (!token) 
            return next();

        try {
            const userFromToken = await this.authService.verifyToken(token);
            const ip = req.ip || req.headers['x-forwarded-for'] as string || req.connection.remoteAddress;

            const isBanned = bannedUsers.some(
                user => user.discordId === userFromToken.discordId || user.ip === ip
            );

            if (isBanned) {
                Logger.warn(`Попытка доступа забаненного пользователя discordId=${userFromToken.discordId}, ip=${ip}`, 'BlockMiddleware');
                throw new HttpException('The user is banned', HttpStatus.FORBIDDEN);
            }

            next();
        } catch (err) {
            Logger.error('Ошибка при проверке токена', err, 'BlockMiddleware');
            throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
        }
    }
}

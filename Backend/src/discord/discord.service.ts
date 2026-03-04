import { InjectDiscordClient } from '@discord-nestjs/core';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Client, EmbedBuilder, NewsChannel, TextChannel, ThreadChannel } from 'discord.js';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { IProject } from '@Interfaces';



@Injectable()
export class DiscordService {
    constructor(
        @InjectModel('Project') private projectModel: Model<IProject>,
        @InjectDiscordClient()
        private readonly client: Client,
        //private readonly redisService: RedisService,
    ) {
        // this.client.on('guildCreate', async (guild) => {
        //     await this.onGuildCreate(guild);
        // });
    }

    createTaskEmbed(title: string, description: string, url?: string): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({
                text: 'Система уведомлений Planline',
                iconURL: 'https://i.imgur.com/AfFp7pu.png',
            });

        if (url)
            embed.setURL(url);

        return embed
    };

    async sendNotificationOnNewTask(channelId: string, title: string, boardName: string): Promise<void> {
        try {
            const channel = await this.client.channels.fetch(channelId);

            if (!channel || !channel.isTextBased())
                throw new Error('Канал не найден или не является текстовым');


            if (
                channel instanceof TextChannel ||
                channel instanceof NewsChannel ||
                channel instanceof ThreadChannel
            ) {
                const embed = this.createTaskEmbed(
                    '📌 Уведомление о новой задаче',
                    `Новая задача **${title}** для **${boardName}**.`,
                );

                await channel.send({ embeds: [embed] });
            } else {
                throw new Error('Тип канала не поддерживает отправку сообщений');
            }
        } catch (error) {
            Logger.error(error, 'DiscordBot');
        }
    }

    async sendNotificationUserOnNewTask(userId: string, title: string, dueDate: Date | null): Promise<void> {
        try {
            const user = await this.client.users.fetch(userId);
            let formattedDueDate: string;

            if (dueDate) {
                formattedDueDate = new Date(dueDate).toLocaleString('ru-RU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
            }
            const message = `Здравствуйте ${user.globalName}, вам присвоена новая задача **${title}**${dueDate ? `, которая должна быть готова к ${formattedDueDate}` : ''}`;

            const embed = this.createTaskEmbed(
                '📌 Уведомление по задаче',
                message
            );

            await user.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(error, 'DiscordBot')
        }
    };

    async getMember(guildId: string, userId: string) {
        const guild = await this.client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);

        return member || null;
    }

    async getGuildMembersById(guildId: string) {
        const guild = await this.client.guilds.fetch(guildId);
        await guild.members.fetch();

        return guild;
    }

    // async handleBotJoin(guild: any) {
    //     const integration = await this.redisService.getIntegrationByOwner(guild.ownerId);

    //     if (!integration)
    //         throw new HttpException('Интеграция не найдена', HttpStatus.FORBIDDEN);

    //     await this.projectModel.findOneAndUpdate(
    //         { id: integration.projectId },
    //         { $set: { discordId: guild.id } },
    //         { new: true }
    //     );

    //     await this.redisService.removeIntegration(guild.ownerId, integration.projectId);
    // };

    // async onGuildCreate(guild: any) {
    //     await this.handleBotJoin(guild);
    // };
}

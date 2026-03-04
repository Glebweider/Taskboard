import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RedisService } from './redis.service';
import { UserSchema } from '@Models';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    ],
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule {}
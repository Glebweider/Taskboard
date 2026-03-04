import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectActivitySchema } from '@Models/index';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'ProjectsActivity', schema: ProjectActivitySchema }]),
    ],
    providers: [ActivityService],
    exports: [ActivityService],
})
export class ActivityModule {}
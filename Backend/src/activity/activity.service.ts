import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EProjectActivityType, IProjectActivity } from '@Interfaces/index';

@Injectable()
export class ActivityService {
	constructor(
		@InjectModel('ProjectsActivity') private activityModel: Model<IProjectActivity>,
	) { }

	async log(params: {
		projectId: string;
		type: EProjectActivityType;
		actorId: string;
		actorName: string;
		payload?: Record<string, any>;
	}) {
		return this.activityModel.create({
			...params,
		});
	}

	async getByProject(projectId: string, limit = 50) {
		return this.activityModel
			.find({ projectId })
			.sort({ createdAt: -1 })
			.limit(limit);
	}
}

import { Query } from 'mongoose';

let queryCount = 0;

export function mongoQueryCounterPlugin(schema: any) {
    // Generic read operations
    schema.pre(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'findOneAndRemove'], function (this: Query<any, any>) {
        queryCount++;
        const query = JSON.stringify(this.getQuery());
        console.log(`[MongoDB] Query #${queryCount} → ${this.model.modelName}.find ${query}`);
    });

    // Save operation
    schema.pre('save', function () {
        queryCount++;
        console.log(`[MongoDB] Query #${queryCount} → save()`);
    });

    // Update operations
    schema.pre(['updateOne', 'updateMany'], function (this: Query<any, any>) {
        queryCount++;
        const update = JSON.stringify(this.getUpdate());
        const query = JSON.stringify(this.getQuery());
        console.log(`[MongoDB] Query #${queryCount} → update ${query} with ${update}`);
    });

    // Delete operations
    schema.pre(['deleteOne', 'deleteMany'], function (this: Query<any, any>) {
        queryCount++;
        const query = JSON.stringify(this.getQuery());
        console.log(`[MongoDB] Query #${queryCount} → delete ${query}`);
    });
}

export function getMongoQueryCount() {
    return queryCount;
}

export function resetMongoQueryCount() {
    queryCount = 0;
}

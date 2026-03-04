import { ThrottlerGetTrackerFunction } from '@nestjs/throttler';

export const getTracker: ThrottlerGetTrackerFunction = req => {
    return req.ips.length ? req.ips[0] : req.ip;
};

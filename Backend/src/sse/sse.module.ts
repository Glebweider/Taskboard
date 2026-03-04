// src/sse/sse.module.ts

// ! lib
// nestjs
import { Module } from '@nestjs/common';

// ! own
// sse
import { SseService } from './sse.service';

@Module({
    imports: [],
    providers: [SseService],
    exports: [SseService]
})
export class SseModule { }

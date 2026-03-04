// src/sse/sse.service.ts

// ! lib
// nestjs
import { Injectable } from '@nestjs/common';
// ! lib
// interface
import { Observable } from 'rxjs';
import { ProjectEvent } from '@Interfaces';


type Subscriber = (event: any) => void;

@Injectable()
export class SseService {
    private subscribers: Map<string, Subscriber[]> = new Map();

    subscribe(projectId: string): Observable<any> {
        return new Observable((subscriber) => {
            const listeners = this.subscribers.get(projectId) || [];

            const listener: Subscriber = (event) => {
                subscriber.next({
                    data: event,
                });
            };

            listeners.push(listener);
            this.subscribers.set(projectId, listeners);

            const pingInterval = setInterval(() => {
                subscriber.next({
                    comment: 'ping',
                });
            }, 15000);

            return () => {
                clearInterval(pingInterval);

                this.subscribers.set(
                    projectId,
                    (this.subscribers.get(projectId) || []).filter((fn) => fn !== listener),
                );
            };
        });
    }

    emit(projectId: string, event: ProjectEvent) {
        const listeners = this.subscribers.get(projectId) || [];
        listeners.forEach((fn) => fn(event));
    }
}

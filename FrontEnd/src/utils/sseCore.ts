/* eslint-disable @typescript-eslint/no-empty-function */

import { 
    addBoardProjects, 
    deleteBoardProjects, 
    removeProject, 
    updateBoardProjects, 
    updateProjectsName 
} from '@Redux/reducers/projectsReducer';
import {
    addCard,
    deleteCard,
    updateCard,
    addList,
    deleteList,
    updateListName,
    IProjectEvent,
    setProject,
    addBoard,
    updateBoard,
    deleteBoard,
    updateProjectName,
    clearProject,
    removeProjectMember,
    updateBoardMemberRole,
    addProjectMember,
    moveCard,
    listMove,
    updateProjectMember
} from '@Redux/reducers/projectReducer';
import store from '@Redux/store';


class SseCore {
    private eventSource: EventSource | null = null;
    private currentProjectId: string | null = null;
    private externalListeners: ((event: IProjectEvent) => void)[] = [];
    private hiddenTimeout: NodeJS.Timeout | null = null;
    private shouldReloadOnReturn = false;

    constructor() {
        store.subscribe(() => {
            const state = store.getState();
            const newProjectId = state.projectReducer.id;

            if (newProjectId !== this.currentProjectId && newProjectId) {
                this.currentProjectId = newProjectId;
                this.connect();
            }
        })

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                this.hiddenTimeout = setTimeout(() => {
                    this.disconnect();
                    this.shouldReloadOnReturn = true;
                }, 5 * 60 * 1000);
            } else {
                if (this.hiddenTimeout) {
                    clearTimeout(this.hiddenTimeout);
                    this.hiddenTimeout = null;
                }

                if (this.shouldReloadOnReturn) {
                    window.location.reload();
                }
            }
        });
    }

    subscribe(listener: (event: IProjectEvent) => void) {
        this.externalListeners.push(listener);
        return () => {
            this.externalListeners = this.externalListeners.filter(l => l !== listener);
        };
    }

    connect() {
        this.disconnect();

        this.eventSource = new EventSource(
            `${process.env.REACT_APP_BACKEND_URI}/projects/${this.currentProjectId}/stream`,
            { withCredentials: true }
        );

        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleEvent(data);
        };

        this.eventSource.onerror = (err) => {
            console.error('SSE error:', err);
        };
    }

    disconnect() {
        this.eventSource?.close();
        this.eventSource = null;
    }

    private handleEvent(event: IProjectEvent) {
        const { type, entity, payload, path } = event;
        if (!path) return;

        this.externalListeners.forEach(l => l(event));

        const pathParts = path.split('.');
        const getIds = (parts: string[]) => {
            const ids: Record<string, string> = {};
            for (let i = 0; i < parts.length; i += 2) {
                ids[parts[i]] = parts[i + 1];
            }
            return ids;
        };

        const ids = getIds(pathParts);
        const actions: Record<string, Record<IProjectEvent['type'], () => void>> = {
            project: {
                create: () => store.dispatch(setProject(payload)),
                update: () => {
                    store.dispatch(updateProjectName(payload));
                    store.dispatch(updateProjectsName({ projectId: store.getState().projectReducer.id, projectName: payload }));
                },
                delete: () => {
                    store.dispatch(clearProject());
                    store.dispatch(removeProject({ projectId: store.getState().projectReducer.id }));
                },
                add: () => store.dispatch(addProjectMember(payload)),
                change: () => store.dispatch(updateProjectMember(payload)),
                remove: () => store.dispatch(removeProjectMember(payload)),
            },
            board: {
                create: () => {
                    store.dispatch(addBoard(payload));
                    store.dispatch(addBoardProjects({ projectId: store.getState().projectReducer.id, board: payload }));
                },
                update: () => {
                    store.dispatch(updateBoard({ boardId: ids.boards, newName: payload.name, newColor: payload.color }));
                    store.dispatch(updateBoardProjects({ boardId: ids.boards, newName: payload.name, newColor: payload.color }));
                },
                delete: () => {
                    store.dispatch(deleteBoard(ids.boards));
                    store.dispatch(deleteBoardProjects({ projectId: store.getState().projectReducer.id, boardId: ids.boards }));
                },
                add: () => { },
                change: () => store.dispatch(updateBoardMemberRole({ boardId: ids.boards, userId: payload.userId, newRole: payload.newRole })),
                remove: () => { }
            },
            list: {
                create: () => store.dispatch(addList({ boardId: ids.boards, list: payload })),
                update: () => store.dispatch(updateListName({ boardId: ids.boards, listId: ids.lists, newName: payload })),
                delete: () => store.dispatch(deleteList({ boardId: ids.boards, listId: ids.lists })),
                change: () => store.dispatch(listMove({ boardId: ids.boards, listId: ids.lists, toPosition: payload.newPosition })),
                add: () => { },
                remove: () => { },
            },
            card: {
                create: () => store.dispatch(addCard({ boardId: ids.boards, listId: ids.lists, card: payload })),
                update: () => store.dispatch(updateCard({ boardId: ids.boards, listId: ids.lists, cardId: ids.cards, updates: payload })),
                delete: () => store.dispatch(deleteCard({ boardId: ids.boards, listId: ids.lists, cardId: ids.cards })),
                change: () => store.dispatch(moveCard({ boardId: ids.boards, fromListId: ids.lists, toListId: payload.newListId, cardId: ids.cards, toPosition: payload.newPosition })),
                add: () => { },
                remove: () => { }
            },
        };

        actions[entity]?.[type]?.();
    }
}

export const sseCore = new SseCore();
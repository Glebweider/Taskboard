export interface ProjectEvent {
    type: 'create' | 'update' | 'delete' | 'add' | 'change' | 'remove';
    entity: 'project' | 'board' | 'list' | 'card' | 'comment';
    payload: any;
    path?: string;
}

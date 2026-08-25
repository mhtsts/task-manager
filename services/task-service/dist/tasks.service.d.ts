interface Task {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    createdAt: string;
    updatedAt: string;
}
export default class taskService {
    private pool;
    constructor();
    getAll(): Promise<Task[]>;
    getById(id: string): Promise<Task | null>;
    create(task: {
        title: string;
        description: string;
    }): Promise<Task>;
    update(id: string, updates: {
        status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    }): Promise<Task | null>;
    delete(id: string): Promise<void>;
}
export {};

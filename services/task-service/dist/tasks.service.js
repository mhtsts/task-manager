"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const crypto_1 = __importDefault(require("crypto"));
class taskService {
    pool;
    constructor() {
        const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/tasksdb';
        this.pool = new pg_1.Pool({
            connectionString,
        });
    }
    async getAll() {
        const { rows } = await this.pool.query('SELECT id, title, description, status, created_at as "createdAt", updated_at as "updatedAt" FROM tasks ORDER BY created_at DESC');
        return rows;
    }
    async getById(id) {
        const { rows } = await this.pool.query('SELECT id, title, description, status, created_at as "createdAt", updated_at as "updatedAt" FROM tasks WHERE id = $1', [id]);
        return rows.length ? rows[0] : null;
    }
    async create(task) {
        const id = crypto_1.default.randomUUID();
        const now = new Date().toISOString();
        const { rows } = await this.pool.query('INSERT INTO tasks (id, title, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, description, status, created_at as "createdAt", updated_at as "updatedAt"', [id, task.title, task.description, 'TODO', now, now]);
        return rows[0];
    }
    async update(id, updates) {
        const existing = await this.getById(id);
        if (!existing)
            return null;
        const status = updates.status ?? existing.status;
        const now = new Date().toISOString();
        const { rows } = await this.pool.query('UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3 RETURNING id, title, description, status, created_at as "createdAt", updated_at as "updatedAt"', [status, now, id]);
        return rows[0];
    }
    async delete(id) {
        await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    }
}
exports.default = taskService;
//# sourceMappingURL=tasks.service.js.map
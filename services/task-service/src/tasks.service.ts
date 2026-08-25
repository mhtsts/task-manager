import { Pool, QueryResult } from 'pg'

interface Task {
  id: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  createdAt: string
  updatedAt: string
}

import crypto from 'crypto'

export default class taskService {
  private pool: Pool

  constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/tasksdb'
    this.pool = new Pool({
      connectionString,
    })
  }

  async getAll(): Promise<Task[]> {
    const { rows } = await this.pool.query('SELECT id, title, description, status, created_at as "createdAt", updated_at as "updatedAt" FROM tasks ORDER BY created_at DESC')
    return rows
  }

  async getById(id: string): Promise<Task | null> {
    const { rows } = await this.pool.query('SELECT id, title, description, status, created_at as "createdAt", updated_at as "updatedAt" FROM tasks WHERE id = $1', [id])
    return rows.length ? rows[0] : null
  }

  async create(task: { title: string; description: string }): Promise<Task> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const { rows } = await this.pool.query(
      'INSERT INTO tasks (id, title, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, description, status, created_at as "createdAt", updated_at as "updatedAt"',
      [id, task.title, task.description, 'TODO', now, now]
    )
    return rows[0]
  }

  async update(id: string, updates: { status?: 'TODO' | 'IN_PROGRESS' | 'DONE' }): Promise<Task | null> {
    const existing = await this.getById(id)
    if (!existing) return null

    const status = updates.status ?? existing.status
    const now = new Date().toISOString()

    const { rows } = await this.pool.query(
      'UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3 RETURNING id, title, description, status, created_at as "createdAt", updated_at as "updatedAt"',
      [status, now, id]
    )
    return rows[0]
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM tasks WHERE id = $1', [id])
  }
}
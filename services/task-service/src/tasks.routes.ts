import * as express from 'express'
import taskService from './tasks.service'

export default function taskRoutes(router: express.Router) {
  const service = new taskService()

  // GET /api/tasks
  router.get('/', async (req: express.Request, res: express.Response) => {
    try {
      const tasks = await service.getAll()
      res.json(tasks)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // GET /api/tasks/:id
  router.get('/:id', async (req: express.Request, res: express.Response) => {
    try {
      const task = await service.getById(req.params.id as string)
      if (!task) return res.status(404).json({ error: 'Task not found' })
      res.json(task)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /api/tasks
  router.post('/', async (req: express.Request, res: express.Response) => {
    try {
      const task = await service.create(req.body)
      res.status(201).json(task)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // PUT /api/tasks/:id
  router.put('/:id', async (req: express.Request, res: express.Response) => {
    try {
      const task = await service.update(req.params.id as string, req.body)
      if (!task) return res.status(404).json({ error: 'Task not found' })
      res.json(task)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // DELETE /api/tasks/:id
  router.delete('/:id', async (req: express.Request, res: express.Response) => {
    try {
      await service.delete(req.params.id as string)
      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })
}
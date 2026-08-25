"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = taskRoutes;
const tasks_service_1 = __importDefault(require("./tasks.service"));
function taskRoutes(router) {
    const service = new tasks_service_1.default();
    // GET /api/tasks
    router.get('/', async (req, res) => {
        try {
            const tasks = await service.getAll();
            res.json(tasks);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    // GET /api/tasks/:id
    router.get('/:id', async (req, res) => {
        try {
            const task = await service.getById(req.params.id);
            if (!task)
                return res.status(404).json({ error: 'Task not found' });
            res.json(task);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    // POST /api/tasks
    router.post('/', async (req, res) => {
        try {
            const task = await service.create(req.body);
            res.status(201).json(task);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    // PUT /api/tasks/:id
    router.put('/:id', async (req, res) => {
        try {
            const task = await service.update(req.params.id, req.body);
            if (!task)
                return res.status(404).json({ error: 'Task not found' });
            res.json(task);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    // DELETE /api/tasks/:id
    router.delete('/:id', async (req, res) => {
        try {
            await service.delete(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
//# sourceMappingURL=tasks.routes.js.map
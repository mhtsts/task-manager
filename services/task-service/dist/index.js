"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const tasks_routes_1 = __importDefault(require("./tasks.routes"));
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
const router = express_1.default.Router();
(0, tasks_routes_1.default)(router);
app.use('/api/tasks', router);
// Health endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'task-service' });
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Task service running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map
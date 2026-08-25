import cors from 'cors'
import express from 'express'
import taskRoutes from './tasks.routes'

const app = express()
app.use(cors())
app.use(express.json())

const router = express.Router()
taskRoutes(router)

app.use('/api/tasks', router)

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'task-service' })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Task service running on port ${PORT}`)
})

export { app }
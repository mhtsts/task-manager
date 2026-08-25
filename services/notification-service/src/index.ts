import express from 'express'

const app = express()
app.use(express.json())

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'notification-service' })
})

const PORT = process.env.PORT || 8081
app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`)
})

export { app }